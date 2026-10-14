import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { oAuthProxy } from "better-auth/plugins";
import { lt } from "drizzle-orm";
import { after } from "next/server";
import db from "@/db";
import * as schema from "@/db/schema";
import { getEmailConfig } from "@/email/config";
import { RESET_EMAIL_COOLDOWN_SECONDS } from "./passwordRules";

// BETTER_AUTH_URL is the production URL in every Netlify context, because
// Google only accepts exact redirect URIs. Deploy previews and branch deploys
// serve auth from their own URL and route Google sign-in through production
// with the OAuth proxy plugin.
const productionURL = process.env.BETTER_AUTH_URL;
const isNetlifyPreview =
  process.env.NETLIFY_CONTEXT === "deploy-preview" ||
  process.env.NETLIFY_CONTEXT === "branch-deploy";
const currentURL =
  isNetlifyPreview && process.env.NETLIFY_DEPLOY_PRIME_URL
    ? process.env.NETLIFY_DEPLOY_PRIME_URL
    : productionURL;

export const auth = betterAuth({
  baseURL: currentURL,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  // Password reset emails are sent with Resend. There's no email
  // verification on sign-up yet.
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      // The rate limit below is per IP, so this also caps emails per account.
      // The upsert only writes, and returns a row, if no email was sent in
      // the cooldown, so of several concurrent requests exactly one sends.
      // Requests that don't send don't move the timestamp, so repeated
      // requests can't keep pushing the next email back.
      const now = new Date();
      const claimed = await db
        .insert(schema.passwordResetEmail)
        .values({ userId: user.id, sentAt: now })
        .onConflictDoUpdate({
          target: schema.passwordResetEmail.userId,
          set: { sentAt: now },
          setWhere: lt(
            schema.passwordResetEmail.sentAt,
            new Date(now.getTime() - RESET_EMAIL_COOLDOWN_SECONDS * 1000),
          ),
        })
        .returning();
      if (claimed.length === 0) return;

      // Loaded here so Resend and the templates stay out of every other
      // request that imports auth.
      const { sendPasswordResetEmail } = await import("@/email");
      await sendPasswordResetEmail({ to: user.email, name: user.name, url });
    },
    // A reset signs the account out everywhere, in case the old password was
    // compromised.
    revokeSessionsOnPasswordReset: true,
  },
  // Deleting requires a fresh session (signed in within the last day), so
  // users are asked to sign in again before deleting their account.
  user: {
    deleteUser: {
      enabled: true,
    },
  },
  // Stored in the database, because each Netlify Function instance has its own
  // memory. Better Auth only rate limits in production, and allows 3 password
  // reset requests per 60 seconds per IP. Session reads aren't limited, so the
  // useSession calls on most pages don't each write to the database.
  rateLimit: {
    storage: "database",
    customRules: {
      "/get-session": false,
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  advanced: {
    // Rate limits are per client IP. Better Auth only reads `x-forwarded-for`
    // by default and gives up when it holds more than one address, putting
    // everyone in one shared bucket. Netlify sets `x-nf-client-connection-ip`
    // to the connecting address itself, so clients can't fake it.
    ipAddress: {
      ipAddressHeaders: ["x-nf-client-connection-ip", "x-forwarded-for"],
    },
    // Without a handler, Better Auth waits for background tasks (such as the
    // password reset email) before responding, so the response time would show
    // whether an account exists. `after` sends the response first and keeps
    // the Netlify Function running until the task finishes. Better Auth is
    // only called inside Next requests, where `after` is available.
    backgroundTasks: {
      handler: (promise) => after(() => promise),
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/request-password-reset") return;

      // The email is sent in the background, where a failure is only logged.
      // Fail here instead, for every email so it doesn't show whether an
      // account exists.
      const { error } = getEmailConfig();
      if (error) {
        ctx.context.logger.error(`Password reset is unavailable: ${error}`);
        throw new APIError("SERVICE_UNAVAILABLE", {
          message:
            "Password reset emails aren't available right now. Please try again later.",
        });
      }
    }),
  },
  plugins: [oAuthProxy({ productionURL, currentURL })],
});
