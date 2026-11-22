import { beforeEach, describe, expect, it } from "vitest";

import { NotAuthenticatedError } from "@application/errors/NotAuthenticatedError";
import { AnalyticsService } from "@application/services/AnalyticsService";
import { CampaignService } from "@application/services/CampaignService";
import { PosterDesignService } from "@application/services/PosterDesignService";
import { CampaignId } from "@domain/campaign/CampaignId";
import { PosterDesignId } from "@domain/campaign/design/PosterDesignId";
import { PosterId } from "@domain/poster/PosterId";
import { PosterName } from "@domain/poster/PosterName";
import { RegistrationLocation } from "@domain/poster/RegistrationLocation";
import { NotFoundError } from "@domain/shared/NotFoundError";

import { makePdf } from "../support/pdfs";
import { FakeSessionProvider } from "./fakes/FakeSessionProvider";
import { InMemoryCampaignRepository } from "./fakes/InMemoryCampaignRepository";
import { InMemoryPosterAnalyticsLookup } from "./fakes/InMemoryPosterAnalyticsLookup";

const { TOP_POSTER_COUNT } = AnalyticsService;
const qrPlacement = { x: 10, y: 20, size: 15, rotation: 45 };

let sessions: FakeSessionProvider;
let campaigns: InMemoryCampaignRepository;
let posterAnalytics: InMemoryPosterAnalyticsLookup;
/** The campaign each design added by `addCampaign` belongs to. */
let campaignOfDesign: Map<string, CampaignId>;
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
  const designIds = campaign!.posterDesigns.map((design) => design.id);
  for (const designId of designIds) {
    campaignOfDesign.set(designId, CampaignId.from(id));
  }
  return { campaignId: id, designIds };
}

/** A location at the given point. */
function at(latitude: number, longitude: number) {
  return RegistrationLocation.create({ latitude, longitude, accuracy: 20 });
}

/**
 * Adds a poster of the design with `scanCount` scans to its campaign's
 * analytics, registered with `posterName` and `location` if a poster name is
 * given.
 */
async function addPoster(
  designId: string,
  scanCount: number,
  posterName?: string,
  location: RegistrationLocation | null = null,
) {
  const posterId = PosterId.generate();
  posterAnalytics.add(campaignOfDesign.get(designId)!, {
    posterId,
    designId: PosterDesignId.from(designId),
    posterName: posterName === undefined ? null : PosterName.create(posterName),
    location: posterName === undefined ? null : location,
    scanCount,
  });
  return posterId;
}

beforeEach(() => {
  sessions = new FakeSessionProvider("alice");
  campaigns = new InMemoryCampaignRepository();
  posterAnalytics = new InMemoryPosterAnalyticsLookup();
  campaignOfDesign = new Map();
  campaignService = new CampaignService(sessions, campaigns);
  service = new AnalyticsService(sessions, campaigns, posterAnalytics);
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

  it("lists the posters with the most scans, most first, with their poster names", async () => {
    const { campaignId, designIds } = await addCampaign(2);
    const [first, second] = designIds;
    const a = await addPoster(first, 1, "Library noticeboard");
    const b = await addPoster(second, 4, "Corner café");
    const c = await addPoster(first, 3, "Bus stop");
    await addPoster(second, 0, "Station");

    expect(await service.getCampaignAnalytics(campaignId)).toMatchObject({
      topPosters: [
        { posterId: b, posterName: "Corner café", scanCount: 4 },
        { posterId: c, posterName: "Bus stop", scanCount: 3 },
        { posterId: a, posterName: "Library noticeboard", scanCount: 1 },
      ],
    });
  });

  it("gives unregistered top posters no poster name", async () => {
    const { campaignId, designIds } = await addCampaign(1);
    const poster = await addPoster(designIds[0], 2);

    expect(await service.getCampaignAnalytics(campaignId)).toMatchObject({
      topPosters: [{ posterId: poster, posterName: null, scanCount: 2 }],
    });
  });

  it("maps the located posters with their scan counts, and counts the posters that aren't on the map", async () => {
    const { campaignId, designIds } = await addCampaign(2);
    const [first, second] = designIds;
    const a = await addPoster(first, 3, "Corner café", at(51.5, -0.12));
    const b = await addPoster(second, 0, "Library", at(51.6, -0.1));
    await addPoster(first, 5, "Station");
    await addPoster(second, 2);

    const analytics = await service.getCampaignAnalytics(campaignId);
    expect(analytics).toMatchObject({
      scanMap: {
        maxScanCount: 3,
        unmappedPosterCount: 2,
        posterCount: 4,
      },
    });
    if (analytics.kind !== "posters") return;
    expect(analytics.scanMap.posters).toHaveLength(2);
    expect(analytics.scanMap.posters).toEqual(
      expect.arrayContaining([
        { posterId: a, latitude: 51.5, longitude: -0.12, scanCount: 3 },
        { posterId: b, latitude: 51.6, longitude: -0.1, scanCount: 0 },
      ]),
    );
  });

  it("maps no posters when none is located", async () => {
    const { campaignId, designIds } = await addCampaign(1);
    await addPoster(designIds[0], 1, "Station");
    await addPoster(designIds[0], 4);

    expect(await service.getCampaignAnalytics(campaignId)).toMatchObject({
      scanMap: {
        posters: [],
        maxScanCount: 0,
        unmappedPosterCount: 2,
        posterCount: 2,
      },
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
      scanMap: {
        posters: [],
        maxScanCount: 0,
        unmappedPosterCount: 1,
        posterCount: 1,
      },
    });
  });

  it("leaves out posters of designs the campaign didn't have when it was loaded", async () => {
    const { campaignId, designIds } = await addCampaign(1);
    await addPoster(designIds[0], 1, "Station", at(51.5, -0.12));
    posterAnalytics.add(CampaignId.from(campaignId), {
      posterId: PosterId.generate(),
      designId: PosterDesignId.generate(),
      posterName: PosterName.create("Corner café"),
      location: at(51.6, -0.1),
      scanCount: 4,
    });

    expect(await service.getCampaignAnalytics(campaignId)).toMatchObject({
      scanDistribution: [{ position: 0, posterCounts: [0, 1] }],
      topPosters: [{ posterName: "Station", scanCount: 1 }],
      scanMap: { maxScanCount: 1, unmappedPosterCount: 0, posterCount: 1 },
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
