import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { oAuthProxy } from "better-auth/plugins";
import { after } from "next/server";
import db from "@/db";
import * as schema from "@/db/schema";
import { sendPasswordResetEmail } from "@/email";

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
