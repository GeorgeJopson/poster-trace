import "server-only";

import type { AccountGateway } from "@application/ports/AccountGateway";
import type { ScanCountLookup } from "@application/ports/ScanCountLookup";
import type { ScanTargetLookup } from "@application/ports/ScanTargetLookup";
import type { SessionProvider } from "@application/ports/SessionProvider";
import { AccountService } from "@application/services/AccountService";
import { AnalyticsService } from "@application/services/AnalyticsService";
import { CampaignService } from "@application/services/CampaignService";
import { PosterDesignService } from "@application/services/PosterDesignService";
import { PosterService } from "@application/services/PosterService";
import { RegistrationService } from "@application/services/RegistrationService";
import { ScanService } from "@application/services/ScanService";
import type { CampaignRepository } from "@domain/campaign/CampaignRepository";
import type { PosterRepository } from "@domain/poster/PosterRepository";
import type { ScanRepository } from "@domain/scan/ScanRepository";
import type { UserRepository } from "@domain/user/UserRepository";
import { BetterAuthAccountGateway } from "@infrastructure/auth/BetterAuthAccountGateway";
import { BetterAuthSessionProvider } from "@infrastructure/auth/BetterAuthSessionProvider";
import { auth } from "@infrastructure/auth/betterAuth";
import { getDb } from "@infrastructure/db/client";
import { DrizzleCampaignRepository } from "@infrastructure/repositories/DrizzleCampaignRepository";
import { DrizzlePosterRepository } from "@infrastructure/repositories/DrizzlePosterRepository";
import { DrizzleScanCountLookup } from "@infrastructure/repositories/DrizzleScanCountLookup";
import { DrizzleScanRepository } from "@infrastructure/repositories/DrizzleScanRepository";
import { DrizzleScanTargetLookup } from "@infrastructure/repositories/DrizzleScanTargetLookup";
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
    NetlifyBlobStore.forPosterDesigns(),
  ));
}

let posterRepository: PosterRepository | undefined;
function getPosterRepository() {
  return (posterRepository ??= new DrizzlePosterRepository(getDb()));
}

let scanRepository: ScanRepository | undefined;
function getScanRepository() {
  return (scanRepository ??= new DrizzleScanRepository(getDb()));
}

let scanTargetLookup: ScanTargetLookup | undefined;
function getScanTargetLookup() {
  return (scanTargetLookup ??= new DrizzleScanTargetLookup(getDb()));
}

let scanCountLookup: ScanCountLookup | undefined;
function getScanCountLookup() {
  return (scanCountLookup ??= new DrizzleScanCountLookup(getDb()));
}

/**
 * Where QR codes point. A poster generated on a deploy preview or branch
 * deploy only exists in that deploy's database branch, so its QR code points
 * back at that deploy. Everywhere else it's POSTER_TRACE_URL, which is the
 * production URL in production (see ADR-0014).
 */
function getPosterTraceUrl() {
  const isNetlifyPreview =
    process.env.NETLIFY_CONTEXT === "deploy-preview" ||
    process.env.NETLIFY_CONTEXT === "branch-deploy";
  if (isNetlifyPreview && process.env.NETLIFY_DEPLOY_PRIME_URL) {
    return process.env.NETLIFY_DEPLOY_PRIME_URL;
  }
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

let scanService: ScanService | undefined;
export function getScanService() {
  return (scanService ??= new ScanService(
    getScanTargetLookup(),
    getScanRepository(),
  ));
}

let registrationService: RegistrationService | undefined;
export function getRegistrationService() {
  return (registrationService ??= new RegistrationService(
    getPosterRepository(),
  ));
}

let analyticsService: AnalyticsService | undefined;
export function getAnalyticsService() {
  return (analyticsService ??= new AnalyticsService(
    getSessionProvider(),
    getCampaignRepository(),
    getScanCountLookup(),
  ));
}

let accountService: AccountService | undefined;
export function getAccountService() {
  return (accountService ??= new AccountService(
    getSessionProvider(),
    getUserRepository(),
    getAccountGateway(),
  ));
}
