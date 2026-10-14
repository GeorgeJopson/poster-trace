import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { oAuthProxy } from "better-auth/plugins";
import { and, count, eq, gt, like } from "drizzle-orm";
import { after } from "next/server";
import db from "@/db";
import * as schema from "@/db/schema";
import { sendPasswordResetEmail } from "@/email";

// At most one password reset email per account in this time.
const RESET_EMAIL_INTERVAL_MS = 60 * 1000;

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
      // Better Auth creates this request's token before calling here, so
      // another token from the last minute means an email was just sent.
      const [{ recentTokens }] = await db
        .select({ recentTokens: count() })
        .from(schema.verification)
        .where(
          and(
            eq(schema.verification.value, user.id),
            like(schema.verification.identifier, "reset-password:%"),
            gt(
              schema.verification.createdAt,
              new Date(Date.now() - RESET_EMAIL_INTERVAL_MS),
            ),
          ),
        );
      if (recentTokens > 1) return;

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
  // reset requests per 60 seconds per IP.
  rateLimit: {
    storage: "database",
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  // Without a handler, Better Auth waits for background tasks (such as the
  // password reset email) before responding, so the response time would show
  // whether an account exists. `after` sends the response first and keeps the
  // Netlify Function running until the task finishes. Better Auth is only
  // called inside Next requests, where `after` is available.
  advanced: {
    backgroundTasks: {
      handler: (promise) => after(() => promise),
    },
  },
  plugins: [oAuthProxy({ productionURL, currentURL })],
});
