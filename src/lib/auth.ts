import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { oAuthProxy } from "better-auth/plugins";
import prisma from "@/lib/prisma";

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
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [oAuthProxy({ productionURL, currentURL })],
});
