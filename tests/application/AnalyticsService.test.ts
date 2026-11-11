import { beforeEach, describe, expect, it } from "vitest";

import { NotAuthenticatedError } from "@application/errors/NotAuthenticatedError";
import { AnalyticsService } from "@application/services/AnalyticsService";
import { CampaignService } from "@application/services/CampaignService";
import { PosterDesignService } from "@application/services/PosterDesignService";
import { CampaignId } from "@domain/campaign/CampaignId";
import { PosterDesignId } from "@domain/campaign/design/PosterDesignId";
import { Poster } from "@domain/poster/Poster";
import { Scan } from "@domain/scan/Scan";
import { NotFoundError } from "@domain/shared/NotFoundError";

import { makePdf } from "../support/pdfs";
import { FakeSessionProvider } from "./fakes/FakeSessionProvider";
import { InMemoryCampaignRepository } from "./fakes/InMemoryCampaignRepository";
import { InMemoryPosterRepository } from "./fakes/InMemoryPosterRepository";
import { InMemoryScanCountLookup } from "./fakes/InMemoryScanCountLookup";
import { InMemoryScanRepository } from "./fakes/InMemoryScanRepository";

const { TOP_POSTER_COUNT } = AnalyticsService;
const qrPlacement = { x: 10, y: 20, size: 15, rotation: 45 };

let sessions: FakeSessionProvider;
let campaigns: InMemoryCampaignRepository;
let posters: InMemoryPosterRepository;
let scans: InMemoryScanRepository;
let campaignService: CampaignService;
let service: AnalyticsService;

/** A campaign of the signed-in user with `designCount` designs. */
async function addCampaign(designCount: number) {
  const { id } = await campaignService.createCampaign({
    name: "Campaign",
    target: "https://example.com/",
  });
  const designs = new PosterDesignService(sessions, campaigns);
  for (let i = 0; i < designCount; i++) {
    await designs.createPosterDesign(id, {
      image: new Blob([await makePdf()], { type: "application/pdf" }),
      qrPlacement,
    });
  }
  const campaign = await campaignService.getMyCampaign(id);
  return {
    campaignId: id,
    designIds: campaign!.posterDesigns.map((design) => design.id),
  };
}

/** Stores a poster of the design and `scanCount` scans of it. */
async function addPoster(designId: string, scanCount: number) {
  const [poster] = Poster.generate(PosterDesignId.from(designId), 1);
  await posters.addAll([poster]);
  for (let i = 0; i < scanCount; i++) {
    await scans.add(Scan.create(poster.id, new Date()));
  }
  return poster.id;
}

beforeEach(() => {
  sessions = new FakeSessionProvider("alice");
  campaigns = new InMemoryCampaignRepository();
  posters = new InMemoryPosterRepository();
  scans = new InMemoryScanRepository(posters);
  campaignService = new CampaignService(sessions, campaigns);
  service = new AnalyticsService(
    sessions,
    campaigns,
    new InMemoryScanCountLookup(posters, scans),
  );
});

describe("getCampaignAnalytics", () => {
  it("reports no posters when none of the campaign's designs has any", async () => {
    const { campaignId } = await addCampaign(2);
    expect(await service.getCampaignAnalytics(campaignId)).toEqual({
      kind: "noPosters",
    });
  });

  it("counts each design's posters by scan count, in campaign order, with every count up to the highest", async () => {
    const { campaignId, designIds } = await addCampaign(3);
    const [first, second] = designIds;
    await addPoster(first, 0);
    await addPoster(first, 0);
    await addPoster(first, 2);
    await addPoster(second, 1);

    expect(await service.getCampaignAnalytics(campaignId)).toMatchObject({
      kind: "posters",
      scanDistribution: [
        { position: 0, posterCounts: [2, 0, 1] },
        { position: 1, posterCounts: [0, 1, 0] },
        { position: 2, posterCounts: [0, 0, 0] },
      ],
    });
  });

  it("lists the posters with the most scans, most first, with their design's position", async () => {
    const { campaignId, designIds } = await addCampaign(2);
    const [first, second] = designIds;
    const a = await addPoster(first, 1);
    const b = await addPoster(second, 4);
    const c = await addPoster(first, 3);
    await addPoster(second, 0);

    expect(await service.getCampaignAnalytics(campaignId)).toMatchObject({
      topPosters: [
        { posterId: b, designPosition: 1, scanCount: 4 },
        { posterId: c, designPosition: 0, scanCount: 3 },
        { posterId: a, designPosition: 0, scanCount: 1 },
      ],
    });
  });

  it("ignores other campaigns' posters", async () => {
    const { campaignId, designIds } = await addCampaign(1);
    const other = await addCampaign(1);
    await addPoster(other.designIds[0], 3);
    await addPoster(designIds[0], 0);

    expect(await service.getCampaignAnalytics(campaignId)).toEqual({
      kind: "posters",
      scanDistribution: [{ position: 0, posterCounts: [1] }],
      topPosters: [],
    });
  });

  it(`lists at most ${TOP_POSTER_COUNT} posters, ordering ones with the same scan count by id`, async () => {
    const { campaignId, designIds } = await addCampaign(1);
    const ids: string[] = [];
    for (let i = 0; i <= TOP_POSTER_COUNT; i++) {
      ids.push(await addPoster(designIds[0], 2));
    }

    const analytics = await service.getCampaignAnalytics(campaignId);
    expect(analytics.kind).toBe("posters");
    if (analytics.kind !== "posters") return;
    expect(analytics.topPosters.map(({ posterId }) => posterId)).toEqual(
      ids.toSorted().slice(0, TOP_POSTER_COUNT),
    );
  });

  it("throws NotFoundError for another user's campaign", async () => {
    const { campaignId } = await addCampaign(1);
    sessions.signInAs("bob");
    await expect(service.getCampaignAnalytics(campaignId)).rejects.toThrow(
      NotFoundError,
    );
  });

  it.each([
    ["a non-UUID campaign id", () => "1"],
    ["an unknown campaign id", () => CampaignId.generate()],
  ])("throws NotFoundError for %s", async (_case, campaignId) => {
    await expect(service.getCampaignAnalytics(campaignId())).rejects.toThrow(
      NotFoundError,
    );
  });

  it("throws NotAuthenticatedError when signed out, whatever the input", async () => {
    const { campaignId } = await addCampaign(1);
    sessions.signOut();
    await expect(service.getCampaignAnalytics(campaignId)).rejects.toThrow(
      NotAuthenticatedError,
    );
    await expect(service.getCampaignAnalytics("not-a-uuid")).rejects.toThrow(
      NotAuthenticatedError,
    );
  });
});
