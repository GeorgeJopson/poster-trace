import "server-only";

import type { AccountGateway } from "@application/ports/AccountGateway";
import type { SessionProvider } from "@application/ports/SessionProvider";
import { AccountService } from "@application/services/AccountService";
import { CampaignService } from "@application/services/CampaignService";
import { PosterDesignService } from "@application/services/PosterDesignService";
import { PosterService } from "@application/services/PosterService";
import type { CampaignRepository } from "@domain/campaign/CampaignRepository";
import type { PosterRepository } from "@domain/poster/PosterRepository";
import type { UserRepository } from "@domain/user/UserRepository";
import { BetterAuthAccountGateway } from "@infrastructure/auth/BetterAuthAccountGateway";
import { BetterAuthSessionProvider } from "@infrastructure/auth/BetterAuthSessionProvider";
import { auth } from "@infrastructure/auth/betterAuth";
import { getDb } from "@infrastructure/db/client";
import { DrizzleCampaignRepository } from "@infrastructure/repositories/DrizzleCampaignRepository";
import { DrizzlePosterRepository } from "@infrastructure/repositories/DrizzlePosterRepository";
import { DrizzleUserRepository } from "@infrastructure/repositories/DrizzleUserRepository";
import { NetlifyBlobStore } from "@infrastructure/storage/NetlifyBlobStore";

// The composition root: the only place in the app that wires infrastructure
// to the interfaces the application uses. Each getter builds its object on
// first use and keeps it for the life of the process, so nothing connects at
// import or build time. Everything here is stateless; per-request state (the
// session) is read by the session provider itself.

let sessionProvider: SessionProvider | undefined;
function getSessionProvider() {
  return (sessionProvider ??= new BetterAuthSessionProvider(auth));
}

let accountGateway: AccountGateway | undefined;
function getAccountGateway() {
  return (accountGateway ??= new BetterAuthAccountGateway(auth));
}

let userRepository: UserRepository | undefined;
function getUserRepository() {
  return (userRepository ??= new DrizzleUserRepository(getDb()));
}

let campaignRepository: CampaignRepository | undefined;
function getCampaignRepository() {
  return (campaignRepository ??= new DrizzleCampaignRepository(
    getDb(),
    new NetlifyBlobStore(
      NetlifyBlobStore.POSTER_DESIGN_STORE,
      NetlifyBlobStore.deletesAllowedIn(process.env.NETLIFY_CONTEXT),
    ),
  ));
}

let posterRepository: PosterRepository | undefined;
function getPosterRepository() {
  return (posterRepository ??= new DrizzlePosterRepository(getDb()));
}

/**
 * Where QR codes point. Printed posters outlive deploy previews, so this is
 * the production URL in every Netlify context.
 */
function getPosterTraceUrl() {
  const url = process.env.POSTER_TRACE_URL;
  if (!url) {
    throw new Error("POSTER_TRACE_URL isn't set (see README.md).");
  }
  return url;
}

let campaignService: CampaignService | undefined;
export function getCampaignService() {
  return (campaignService ??= new CampaignService(
    getSessionProvider(),
    getCampaignRepository(),
  ));
}

let posterDesignService: PosterDesignService | undefined;
export function getPosterDesignService() {
  return (posterDesignService ??= new PosterDesignService(
    getSessionProvider(),
    getCampaignRepository(),
  ));
}

let posterService: PosterService | undefined;
export function getPosterService() {
  return (posterService ??= new PosterService(
    getSessionProvider(),
    getCampaignRepository(),
    getPosterRepository(),
    getPosterTraceUrl(),
  ));
}

let accountService: AccountService | undefined;
export function getAccountService() {
  return (accountService ??= new AccountService(
    getSessionProvider(),
    getUserRepository(),
    getCampaignRepository(),
    getAccountGateway(),
  ));
}
