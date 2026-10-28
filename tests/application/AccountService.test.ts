import { beforeEach, describe, expect, it } from "vitest";

import { AccountDeletionRefusedError } from "@application/errors/AccountDeletionRefusedError";
import { NotAuthenticatedError } from "@application/errors/NotAuthenticatedError";
import { AccountService } from "@application/services/AccountService";
import { CampaignService } from "@application/services/CampaignService";
import { PosterDesignService } from "@application/services/PosterDesignService";
import { UserId } from "@domain/user/UserId";

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
  service = new AccountService(sessions, users, campaigns, gateway);
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
      image: new Blob(["image"], { type: "image/png" }),
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
  it("deletes the account, then its design images", async () => {
    await addDesigns(2);
    sessions.signInAs("bob");
    await addDesigns(1);
    sessions.signInAs("alice");
    const aliceRefs = await campaigns.findAllDesignImageRefsByOwner(
      UserId.from("alice"),
    );

    await service.deleteAccount();

    expect(gateway.deleteCount).toBe(1);
    // The refs were read before the delete cascaded to the designs.
    expect(campaigns.deletedImageRefs).toEqual(aliceRefs);
    expect(aliceRefs).toHaveLength(2);
    // Bob's image is untouched.
    expect(campaigns.images.size).toBe(1);
  });

  it("keeps the images if the delete is refused", async () => {
    await addDesigns(2);
    gateway.refusal =
      "Session expired. Re-authenticate to perform this action.";

    await expect(service.deleteAccount()).rejects.toThrow(
      new AccountDeletionRefusedError(gateway.refusal),
    );
    expect(campaigns.deletedImageRefs).toEqual([]);
    expect(campaigns.images.size).toBe(2);
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
