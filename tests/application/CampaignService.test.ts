import { beforeEach, describe, expect, it } from "vitest";

import { NotAuthenticatedError } from "@application/errors/NotAuthenticatedError";
import { CampaignService } from "@application/services/CampaignService";
import { CampaignId } from "@domain/campaign/CampaignId";
import { NotFoundError } from "@domain/shared/NotFoundError";
import { ValidationError } from "@domain/shared/ValidationError";

import { FakeSessionProvider } from "./fakes/FakeSessionProvider";
import { InMemoryCampaignRepository } from "./fakes/InMemoryCampaignRepository";

const fields = { name: "Campaign", target: "https://example.com/" };

let sessions: FakeSessionProvider;
let campaigns: InMemoryCampaignRepository;
let service: CampaignService;

beforeEach(() => {
  sessions = new FakeSessionProvider("alice");
  campaigns = new InMemoryCampaignRepository();
  service = new CampaignService(sessions, campaigns);
});

describe("createCampaign", () => {
  it("creates a campaign for the signed-in user", async () => {
    const dto = await service.createCampaign({
      name: "Summer",
      target: "  https://example.com/summer  ",
    });

    expect(CampaignId.parse(dto.id)).toBe(dto.id);
    expect(dto).toEqual({
      id: dto.id,
      name: "Summer",
      target: "https://example.com/summer",
      posterDesigns: [],
    });
    expect(campaigns.campaigns).toMatchObject([
      { id: dto.id, ownerId: "alice", name: "Summer" },
    ]);
  });

  it("rejects an invalid target without storing anything", async () => {
    await expect(
      service.createCampaign({ name: "Bad", target: "not a url" }),
    ).rejects.toThrow(ValidationError);
    expect(campaigns.campaigns).toEqual([]);
  });
});

describe("listMyCampaigns", () => {
  it("lists only the user's campaigns, in creation order", async () => {
    const first = await service.createCampaign({ ...fields, name: "First" });
    sessions.signInAs("bob");
    await service.createCampaign({ ...fields, name: "Bob's" });
    sessions.signInAs("alice");
    const second = await service.createCampaign({ ...fields, name: "Second" });

    const list = await service.listMyCampaigns();
    expect(list.map(({ id }) => id)).toEqual([first.id, second.id]);
  });
});

describe("getMyCampaign", () => {
  it("returns the user's campaign", async () => {
    const created = await service.createCampaign(fields);
    expect(await service.getMyCampaign(created.id)).toEqual(created);
  });

  it("returns null for another user's campaign", async () => {
    const created = await service.createCampaign(fields);
    sessions.signInAs("bob");
    expect(await service.getMyCampaign(created.id)).toBeNull();
  });

  it.each(["1", "not-a-uuid", ""])(
    "returns null for the non-UUID id %j",
    async (id) => {
      expect(await service.getMyCampaign(id)).toBeNull();
    },
  );

  it("returns null for an unknown id", async () => {
    expect(await service.getMyCampaign(CampaignId.generate())).toBeNull();
  });
});

describe("updateCampaign", () => {
  it("updates the name and target", async () => {
    const { id } = await service.createCampaign(fields);
    await service.updateCampaign(id, {
      name: "Renamed",
      target: " https://example.com/new ",
    });
    expect(await service.getMyCampaign(id)).toMatchObject({
      name: "Renamed",
      target: "https://example.com/new",
    });
  });

  it("throws NotFoundError for another user's campaign", async () => {
    const { id } = await service.createCampaign(fields);
    sessions.signInAs("bob");
    await expect(service.updateCampaign(id, fields)).rejects.toThrow(
      NotFoundError,
    );
    sessions.signInAs("alice");
    expect(await service.getMyCampaign(id)).toMatchObject({ name: "Campaign" });
  });

  it("throws NotFoundError for a non-UUID or unknown id", async () => {
    await expect(service.updateCampaign("1", fields)).rejects.toThrow(
      NotFoundError,
    );
    await expect(
      service.updateCampaign(CampaignId.generate(), fields),
    ).rejects.toThrow(NotFoundError);
  });

  it("rejects an invalid target without saving", async () => {
    const { id } = await service.createCampaign(fields);
    await expect(
      service.updateCampaign(id, { name: "Renamed", target: "ftp://x" }),
    ).rejects.toThrow(ValidationError);
    expect(await service.getMyCampaign(id)).toMatchObject({ name: "Campaign" });
  });
});

describe("when signed out", () => {
  it("throws NotAuthenticatedError from every use case, whatever the input", async () => {
    const { id } = await service.createCampaign(fields);
    sessions.signOut();

    await expect(service.listMyCampaigns()).rejects.toThrow(
      NotAuthenticatedError,
    );
    for (const campaignId of [id, "not-a-uuid"]) {
      await expect(service.getMyCampaign(campaignId)).rejects.toThrow(
        NotAuthenticatedError,
      );
      await expect(
        service.updateCampaign(campaignId, { name: "", target: "invalid" }),
      ).rejects.toThrow(NotAuthenticatedError);
    }
    await expect(
      service.createCampaign({ name: "", target: "invalid" }),
    ).rejects.toThrow(NotAuthenticatedError);
  });
});
