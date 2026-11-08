import { beforeEach, describe, expect, it } from "vitest";

import { NotAuthenticatedError } from "@application/errors/NotAuthenticatedError";
import { AnalyticsService } from "@application/services/AnalyticsService";
import { CampaignService } from "@application/services/CampaignService";
import { PosterDesignService } from "@application/services/PosterDesignService";
import { CampaignId } from "@domain/campaign/CampaignId";
import { PosterDesignId } from "@domain/campaign/design/PosterDesignId";
import { Poster } from "@domain/poster/Poster";
import { NotFoundError } from "@domain/shared/NotFoundError";
import { ValidationError } from "@domain/shared/ValidationError";

import { makePdf } from "../support/pdfs";
import { FakeSessionProvider } from "./fakes/FakeSessionProvider";
import { InMemoryCampaignRepository } from "./fakes/InMemoryCampaignRepository";
import { InMemoryPosterRepository } from "./fakes/InMemoryPosterRepository";
import { InMemoryScanCountLookup } from "./fakes/InMemoryScanCountLookup";

const qrPlacement = { x: 10, y: 20, size: 15, rotation: 45 };

let sessions: FakeSessionProvider;
let campaigns: InMemoryCampaignRepository;
let posters: InMemoryPosterRepository;
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

/** Stores a poster of the design and `scans` scans of it. */
async function addPoster(designId: string, scans: number) {
  const [poster] = Poster.generate(PosterDesignId.from(designId), 1);
  await posters.addAll([poster]);
  for (let i = 0; i < scans; i++) poster.addScan(new Date());
  await posters.addNewScans(poster);
  return poster.id;
}

beforeEach(() => {
  sessions = new FakeSessionProvider("alice");
  campaigns = new InMemoryCampaignRepository();
  posters = new InMemoryPosterRepository();
  campaignService = new CampaignService(sessions, campaigns);
  service = new AnalyticsService(
    sessions,
    campaigns,
    new InMemoryScanCountLookup(posters),
  );
});

describe("getScanDistribution", () => {
  it("counts a design's posters by scan count, with every count up to the highest", async () => {
    const { campaignId, designIds } = await addCampaign(1);
    const [design] = designIds;
    await addPoster(design, 0);
    await addPoster(design, 0);
    await addPoster(design, 2);

    expect(await service.getScanDistribution(campaignId)).toEqual([
      { scans: 0, posters: { [design]: 2 } },
      { scans: 1, posters: { [design]: 0 } },
      { scans: 2, posters: { [design]: 1 } },
    ]);
  });

  it("has every design of the campaign in every row, even one with no posters", async () => {
    const { campaignId, designIds } = await addCampaign(3);
    const [first, second, third] = designIds;
    await addPoster(first, 1);
    await addPoster(second, 0);
    await addPoster(second, 1);

    expect(await service.getScanDistribution(campaignId)).toEqual([
      { scans: 0, posters: { [first]: 0, [second]: 1, [third]: 0 } },
      { scans: 1, posters: { [first]: 1, [second]: 1, [third]: 0 } },
    ]);
  });

  it("ignores other campaigns' posters", async () => {
    const { campaignId, designIds } = await addCampaign(1);
    const other = await addCampaign(1);
    await addPoster(other.designIds[0], 3);
    await addPoster(designIds[0], 0);

    expect(await service.getScanDistribution(campaignId)).toEqual([
      { scans: 0, posters: { [designIds[0]]: 1 } },
    ]);
  });

  it("is empty when the campaign has no posters", async () => {
    const { campaignId } = await addCampaign(2);
    expect(await service.getScanDistribution(campaignId)).toEqual([]);
  });
});

describe("getTopPosters", () => {
  it("returns the posters with the most scans, most first", async () => {
    const { campaignId, designIds } = await addCampaign(2);
    const [first, second] = designIds;
    const a = await addPoster(first, 1);
    const b = await addPoster(second, 4);
    const c = await addPoster(first, 3);
    await addPoster(second, 2);

    expect(await service.getTopPosters(campaignId, 2)).toEqual([
      { posterId: b, designId: second, scans: 4 },
      { posterId: c, designId: first, scans: 3 },
    ]);
    expect(await service.getTopPosters(campaignId, 4)).toContainEqual({
      posterId: a,
      designId: first,
      scans: 1,
    });
  });

  it("leaves out posters with no scans, so it can return fewer than asked for", async () => {
    const { campaignId, designIds } = await addCampaign(1);
    const scanned = await addPoster(designIds[0], 1);
    await addPoster(designIds[0], 0);

    expect(await service.getTopPosters(campaignId, 5)).toEqual([
      { posterId: scanned, designId: designIds[0], scans: 1 },
    ]);
  });

  it("orders posters with the same scan count by id", async () => {
    const { campaignId, designIds } = await addCampaign(1);
    const ids = [
      await addPoster(designIds[0], 2),
      await addPoster(designIds[0], 2),
      await addPoster(designIds[0], 2),
    ];

    const top = await service.getTopPosters(campaignId, 3);
    expect(top.map(({ posterId }) => posterId)).toEqual(ids.toSorted());
  });

  it.each([0, -1, 2.5])("rejects a number of %s", async (num) => {
    const { campaignId } = await addCampaign(1);
    await expect(service.getTopPosters(campaignId, num)).rejects.toThrow(
      ValidationError,
    );
  });
});

describe.each([
  ["getScanDistribution", (id: string) => service.getScanDistribution(id)],
  ["getTopPosters", (id: string) => service.getTopPosters(id, 5)],
])("%s", (_name, analyse) => {
  it("throws NotFoundError for another user's campaign", async () => {
    const { campaignId } = await addCampaign(1);
    sessions.signInAs("bob");
    await expect(analyse(campaignId)).rejects.toThrow(NotFoundError);
  });

  it.each([
    ["a non-UUID campaign id", () => "1"],
    ["an unknown campaign id", () => CampaignId.generate()],
  ])("throws NotFoundError for %s", async (_case, campaignId) => {
    await expect(analyse(campaignId())).rejects.toThrow(NotFoundError);
  });

  it("throws NotAuthenticatedError when signed out, whatever the input", async () => {
    const { campaignId } = await addCampaign(1);
    sessions.signOut();
    await expect(analyse(campaignId)).rejects.toThrow(NotAuthenticatedError);
    await expect(analyse("not-a-uuid")).rejects.toThrow(NotAuthenticatedError);
  });
});

it("getTopPosters checks sign-in before the number", async () => {
  sessions.signOut();
  await expect(service.getTopPosters("not-a-uuid", 0)).rejects.toThrow(
    NotAuthenticatedError,
  );
});
