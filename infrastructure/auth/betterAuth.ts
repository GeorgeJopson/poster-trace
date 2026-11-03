import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { oAuthProxy } from "better-auth/plugins";
import { after } from "next/server";
import { getDb } from "../db/client";
import * as schema from "../db/schema";
import { getEmailConfig } from "../email/emailConfig";
import { tryClaimResetEmailCooldown } from "../email/resetEmailCooldown";

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

// The lazy client, which connects on first use, so importing this module
// (e.g. during `next build`) never connects.
const db = getDb();

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
      // At most one email per account per cooldown, on top of the per-IP
      // rate limit below.
      if (!(await tryClaimResetEmailCooldown(db, user.id, new Date()))) return;

      // Loaded here so Resend and the templates stay out of every other
      // request that imports auth.
      const { sendPasswordResetEmail } = await import("../email");
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

export type BetterAuth = typeof auth;
