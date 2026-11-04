import { beforeEach, describe, expect, it } from "vitest";

import { NotAuthenticatedError } from "@application/errors/NotAuthenticatedError";
import { CampaignService } from "@application/services/CampaignService";
import { PosterDesignService } from "@application/services/PosterDesignService";
import { PosterService } from "@application/services/PosterService";
import { CampaignId } from "@domain/campaign/CampaignId";
import { PosterDesignId } from "@domain/campaign/design/PosterDesignId";
import { PosterId } from "@domain/poster/PosterId";
import { NotFoundError } from "@domain/shared/NotFoundError";
import { ValidationError } from "@domain/shared/ValidationError";

import { pngBytes } from "../support/images";
import { FakeSessionProvider } from "./fakes/FakeSessionProvider";
import { InMemoryCampaignRepository } from "./fakes/InMemoryCampaignRepository";
import { InMemoryPosterRepository } from "./fakes/InMemoryPosterRepository";

const BASE_URL = "https://www.postertrace.app";
const qrPlacement = { x: 10, y: 20, size: 15, rotation: 45 };

let sessions: FakeSessionProvider;
let campaigns: InMemoryCampaignRepository;
let posters: InMemoryPosterRepository;
let campaignService: CampaignService;
let service: PosterService;
let campaignId: string;
let designId: string;

async function addCampaignWithDesign() {
  const { id } = await campaignService.createCampaign({
    name: "Campaign",
    target: "https://example.com/",
  });
  await new PosterDesignService(sessions, campaigns).createPosterDesign(id, {
    image: new Blob([pngBytes()], { type: "image/png" }),
    qrPlacement,
  });
  const campaign = await campaignService.getMyCampaign(id);
  return { campaignId: id, designId: campaign!.posterDesigns[0].id };
}

beforeEach(async () => {
  sessions = new FakeSessionProvider("alice");
  campaigns = new InMemoryCampaignRepository();
  posters = new InMemoryPosterRepository();
  campaignService = new CampaignService(sessions, campaigns);
  service = new PosterService(sessions, campaigns, posters, BASE_URL);
  ({ campaignId, designId } = await addCampaignWithDesign());
});

describe("generatePosters", () => {
  it("stores the posters and returns each one's redirect URL", async () => {
    const generated = await service.generatePosters(campaignId, designId, 3);

    expect(generated).toHaveLength(3);
    for (const poster of generated) {
      expect(PosterId.parse(poster.id)).toBe(poster.id);
      expect(poster.redirectUrl).toBe(`${BASE_URL}/redirect/${poster.id}`);
    }
    expect(posters.posters).toEqual(
      generated.map(({ id }) => ({ id, designId })),
    );
  });

  it("builds the URL from a base URL with a trailing slash", async () => {
    service = new PosterService(sessions, campaigns, posters, `${BASE_URL}/`);
    const [poster] = await service.generatePosters(campaignId, designId, 1);
    expect(poster.redirectUrl).toBe(`${BASE_URL}/redirect/${poster.id}`);
  });

  it.each([0, 2.5])(
    "rejects a count of %s before storing anything",
    async (count) => {
      await expect(
        service.generatePosters(campaignId, designId, count),
      ).rejects.toThrow(ValidationError);
      expect(posters.posters).toEqual([]);
    },
  );

  it("throws NotFoundError for another user's design", async () => {
    sessions.signInAs("bob");
    await expect(
      service.generatePosters(campaignId, designId, 1),
    ).rejects.toThrow(NotFoundError);
    expect(posters.posters).toEqual([]);
  });

  it("throws NotFoundError for a design of a different campaign", async () => {
    const other = await addCampaignWithDesign();
    await expect(
      service.generatePosters(campaignId, other.designId, 1),
    ).rejects.toThrow(NotFoundError);
    expect(posters.posters).toEqual([]);
  });

  it.each([
    ["a non-UUID campaign id", () => ["1", designId]],
    ["an unknown campaign id", () => [CampaignId.generate(), designId]],
    ["a non-UUID design id", () => [campaignId, "1"]],
    ["an unknown design id", () => [campaignId, PosterDesignId.generate()]],
  ])("throws NotFoundError for %s", async (_case, ids) => {
    const [campaign, design] = ids();
    await expect(service.generatePosters(campaign, design, 1)).rejects.toThrow(
      NotFoundError,
    );
  });
});

describe("when signed out", () => {
  it("throws NotAuthenticatedError, whatever the input", async () => {
    sessions.signOut();
    await expect(
      service.generatePosters(campaignId, designId, 1),
    ).rejects.toThrow(NotAuthenticatedError);
    await expect(
      service.generatePosters("not-a-uuid", "not-a-uuid", -1),
    ).rejects.toThrow(NotAuthenticatedError);
    expect(posters.posters).toEqual([]);
  });
});
