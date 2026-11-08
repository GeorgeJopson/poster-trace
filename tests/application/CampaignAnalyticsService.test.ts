import { beforeEach, describe, expect, it } from "vitest";

import { NotAuthenticatedError } from "@application/errors/NotAuthenticatedError";
import { CampaignAnalyticsService } from "@application/services/CampaignAnalyticsService";
import { CampaignService } from "@application/services/CampaignService";
import { PosterDesignService } from "@application/services/PosterDesignService";
import { PosterService } from "@application/services/PosterService";
import { CampaignId } from "@domain/campaign/CampaignId";
import { PosterId } from "@domain/poster/PosterId";

import { makePdf } from "../support/pdfs";
import { FakeSessionProvider } from "./fakes/FakeSessionProvider";
import { InMemoryCampaignRepository } from "./fakes/InMemoryCampaignRepository";
import { InMemoryPosterRepository } from "./fakes/InMemoryPosterRepository";
import { InMemoryPosterScanCounts } from "./fakes/InMemoryPosterScanCounts";

const qrPlacement = { x: 10, y: 20, size: 15, rotation: 45 };

let sessions: FakeSessionProvider;
let campaigns: InMemoryCampaignRepository;
let posters: InMemoryPosterRepository;
let campaignService: CampaignService;
let posterService: PosterService;
let service: CampaignAnalyticsService;
let campaignId: string;
let designId: string;

async function addCampaignWithDesign() {
  const { id } = await campaignService.createCampaign({
    name: "Campaign",
    target: "https://example.com/",
  });
  await new PosterDesignService(sessions, campaigns).createPosterDesign(id, {
    image: new Blob([await makePdf()], { type: "application/pdf" }),
    qrPlacement,
  });
  const campaign = await campaignService.getMyCampaign(id);
  return { campaignId: id, designId: campaign!.posterDesigns[0].id };
}

/** Records `count` scans of the poster, as a scan of its QR code would. */
async function scan(posterId: string, count = 1) {
  for (let i = 0; i < count; i++) {
    const poster = await posters.findById(PosterId.parse(posterId)!);
    poster!.addScan(new Date());
    await posters.addNewScans(poster!);
  }
}

beforeEach(async () => {
  sessions = new FakeSessionProvider("alice");
  campaigns = new InMemoryCampaignRepository();
  posters = new InMemoryPosterRepository();
  campaignService = new CampaignService(sessions, campaigns);
  posterService = new PosterService(
    sessions,
    campaigns,
    posters,
    "https://www.postertrace.app",
  );
  service = new CampaignAnalyticsService(
    sessions,
    campaigns,
    new InMemoryPosterScanCounts(posters),
  );
  ({ campaignId, designId } = await addCampaignWithDesign());
});

describe("getMyCampaignScanCounts", () => {
  it("lists each poster of the campaign's design with its scan count", async () => {
    const [first, second] = await posterService.generatePosters(
      campaignId,
      designId,
      2,
    );
    await scan(first.id, 3);
    await scan(second.id, 1);

    expect(await service.getMyCampaignScanCounts(campaignId)).toEqual({
      scanCount: 4,
      posterDesigns: [
        {
          id: designId,
          scanCount: 4,
          posters: [
            { id: first.id, scanCount: 3 },
            { id: second.id, scanCount: 1 },
          ],
        },
      ],
    });
  });

  it("puts the most-scanned posters first, then orders by id", async () => {
    const generated = await posterService.generatePosters(
      campaignId,
      designId,
      3,
    );
    const [first, second, last] = generated
      .map(({ id }) => id)
      .sort((a, b) => (a < b ? -1 : 1));
    // The poster with the largest id, so scans must move it to the front.
    await scan(last, 2);

    const counts = await service.getMyCampaignScanCounts(campaignId);
    expect(counts!.posterDesigns[0].posters).toEqual([
      { id: last, scanCount: 2 },
      { id: first, scanCount: 0 },
      { id: second, scanCount: 0 },
    ]);
  });

  it("lists every design in order, including ones with no posters, and nothing from other campaigns", async () => {
    await new PosterDesignService(sessions, campaigns).createPosterDesign(
      campaignId,
      {
        image: new Blob([await makePdf()], { type: "application/pdf" }),
        qrPlacement,
      },
    );
    const secondDesignId = (await campaignService.getMyCampaign(campaignId))!
      .posterDesigns[1].id;
    const [poster] = await posterService.generatePosters(
      campaignId,
      designId,
      1,
    );
    await scan(poster.id, 2);
    const other = await addCampaignWithDesign();
    const [otherPoster] = await posterService.generatePosters(
      other.campaignId,
      other.designId,
      1,
    );
    await scan(otherPoster.id, 5);

    expect(await service.getMyCampaignScanCounts(campaignId)).toEqual({
      scanCount: 2,
      posterDesigns: [
        {
          id: designId,
          scanCount: 2,
          posters: [{ id: poster.id, scanCount: 2 }],
        },
        { id: secondDesignId, scanCount: 0, posters: [] },
      ],
    });
  });

  it("returns null for another user's campaign", async () => {
    await posterService.generatePosters(campaignId, designId, 1);
    sessions.signInAs("bob");
    expect(await service.getMyCampaignScanCounts(campaignId)).toBeNull();
  });

  it.each([
    ["a non-UUID campaign id", () => "1"],
    ["an unknown campaign id", () => CampaignId.generate()],
  ])("returns null for %s", async (_case, id) => {
    expect(await service.getMyCampaignScanCounts(id())).toBeNull();
  });
});

describe("when signed out", () => {
  it("throws NotAuthenticatedError, whatever the input", async () => {
    sessions.signOut();
    await expect(service.getMyCampaignScanCounts(campaignId)).rejects.toThrow(
      NotAuthenticatedError,
    );
    await expect(service.getMyCampaignScanCounts("not-a-uuid")).rejects.toThrow(
      NotAuthenticatedError,
    );
  });
});
