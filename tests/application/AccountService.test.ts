import { beforeEach, describe, expect, it } from "vitest";

import { AccountDeletionRefusedError } from "@application/errors/AccountDeletionRefusedError";
import { NotAuthenticatedError } from "@application/errors/NotAuthenticatedError";
import { AccountService } from "@application/services/AccountService";
import { CampaignService } from "@application/services/CampaignService";
import { PosterDesignService } from "@application/services/PosterDesignService";
import { UserId } from "@domain/user/UserId";

import { makePdf } from "../support/pdfs";
import { FakeAccountGateway } from "./fakes/FakeAccountGateway";
import { FakeSessionProvider } from "./fakes/FakeSessionProvider";
import { InMemoryCampaignRepository } from "./fakes/InMemoryCampaignRepository";
import { InMemoryUserRepository } from "./fakes/InMemoryUserRepository";

let sessions: FakeSessionProvider;
let users: InMemoryUserRepository;
let campaigns: InMemoryCampaignRepository;
let gateway: FakeAccountGateway;
let service: AccountService;

beforeEach(() => {
  sessions = new FakeSessionProvider("alice");
  users = new InMemoryUserRepository();
  users.add("alice", "Alice", "alice@example.com");
  campaigns = new InMemoryCampaignRepository();
  // Deleting the user cascades to their campaigns and designs.
  gateway = new FakeAccountGateway(() =>
    campaigns.deleteAllByOwner(UserId.from("alice")),
  );
  service = new AccountService(sessions, users, gateway);
});

/** Gives the signed-in user a campaign with `count` designs. */
async function addDesigns(count: number) {
  const campaignService = new CampaignService(sessions, campaigns);
  const designService = new PosterDesignService(sessions, campaigns);
  const { id } = await campaignService.createCampaign({
    name: "Campaign",
    target: "https://example.com/",
  });
  for (let i = 0; i < count; i++) {
    await designService.createPosterDesign(id, {
      image: new Blob([await makePdf()], { type: "application/pdf" }),
      qrPlacement: { x: 0, y: 0, size: 10, rotation: 0 },
    });
  }
}

describe("getCurrentUser", () => {
  it("returns the signed-in user's name and email", async () => {
    expect(await service.getCurrentUser()).toEqual({
      name: "Alice",
      email: "alice@example.com",
    });
  });

  it("throws if the user is missing", async () => {
    sessions.signInAs("ghost");
    await expect(service.getCurrentUser()).rejects.toThrow("User not found");
  });
});

describe("requireCurrentUserId", () => {
  it("passes when signed in", async () => {
    await expect(service.requireCurrentUserId()).resolves.toBeUndefined();
  });
});

describe("deleteAccount", () => {
  it("deletes the account and leaves its images for the clean-up job", async () => {
    await addDesigns(2);

    await service.deleteAccount();

    expect(gateway.deleteCount).toBe(1);
    expect(await campaigns.findAllByOwner(UserId.from("alice"))).toEqual([]);
    // Images nothing points to are deleted later (ADR-0013).
    expect(campaigns.images.size).toBe(2);
  });

  it("keeps the account if the delete is refused", async () => {
    await addDesigns(2);
    gateway.refusal =
      "Session expired. Re-authenticate to perform this action.";

    await expect(service.deleteAccount()).rejects.toThrow(
      new AccountDeletionRefusedError(gateway.refusal),
    );
    expect(await campaigns.findAllByOwner(UserId.from("alice"))).toHaveLength(
      1,
    );
  });
});

describe("when signed out", () => {
  it("throws NotAuthenticatedError from every use case", async () => {
    sessions.signOut();
    await expect(service.getCurrentUser()).rejects.toThrow(
      NotAuthenticatedError,
    );
    await expect(service.requireCurrentUserId()).rejects.toThrow(
      NotAuthenticatedError,
    );
    await expect(service.deleteAccount()).rejects.toThrow(
      NotAuthenticatedError,
    );
    expect(gateway.deleteCount).toBe(0);
  });
});
