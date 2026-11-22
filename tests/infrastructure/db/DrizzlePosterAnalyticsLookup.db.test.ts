import { beforeEach, describe, expect, it } from "vitest";

import { Campaign } from "@domain/campaign/Campaign";
import { CampaignId } from "@domain/campaign/CampaignId";
import { CampaignTarget } from "@domain/campaign/CampaignTarget";
import type { PosterDesignId } from "@domain/campaign/design/PosterDesignId";
import { PosterDesignImage } from "@domain/campaign/design/PosterDesignImage";
import { QrPlacement } from "@domain/campaign/design/QrPlacement";
import { Poster } from "@domain/poster/Poster";
import { PosterName } from "@domain/poster/PosterName";
import { RegistrationLocation } from "@domain/poster/RegistrationLocation";
import { UserId } from "@domain/user/UserId";
import { scan } from "@infrastructure/db/schema";
import { DrizzleCampaignRepository } from "@infrastructure/repositories/DrizzleCampaignRepository";
import { DrizzlePosterRepository } from "@infrastructure/repositories/DrizzlePosterRepository";
import { DrizzlePosterAnalyticsLookup } from "@infrastructure/repositories/DrizzlePosterAnalyticsLookup";

import { A4_PDF_DETAILS } from "../../support/pdfs";
import { FakeBlobStore } from "./FakeBlobStore";
import { clearDatabase, db, insertUser } from "./testDb";

const alice = UserId.from("alice");

let posters: DrizzlePosterRepository;
let lookup: DrizzlePosterAnalyticsLookup;

beforeEach(async () => {
  await clearDatabase();
  await insertUser(alice);
  posters = new DrizzlePosterRepository(db);
  lookup = new DrizzlePosterAnalyticsLookup(db);
});

/** Stores a campaign with `count` designs, returning its id and theirs. */
async function addCampaign(
  count: number,
): Promise<{ campaignId: CampaignId; designIds: PosterDesignId[] }> {
  const campaign = Campaign.create(
    alice,
    "Campaign",
    CampaignTarget.create("https://example.com/"),
  );
  const designs = Array.from({ length: count }, () =>
    campaign.addDesign(
      QrPlacement.create({ x: 10, y: 10, size: 20, rotation: 0 }),
      PosterDesignImage.create(new Blob(["pdf"]), A4_PDF_DETAILS),
    ),
  );
  await new DrizzleCampaignRepository(db, new FakeBlobStore()).save(campaign);
  return {
    campaignId: campaign.id,
    designIds: designs.map((design) => design.id),
  };
}

/**
 * Stores a poster of the design with `scanCount` scans, registered with
 * `posterName` and `location` if a poster name is given.
 */
async function addPoster(
  designId: PosterDesignId,
  scanCount: number,
  posterName?: string,
  location: RegistrationLocation | null = null,
) {
  const [poster] = Poster.generate(designId, 1);
  if (posterName !== undefined) {
    poster.register(PosterName.create(posterName), location, new Date());
  }
  await posters.save([poster]);
  if (scanCount > 0) {
    await db.insert(scan).values(
      Array.from({ length: scanCount }, () => ({
        id: crypto.randomUUID(),
        posterId: poster.id,
        scannedAt: new Date(),
      })),
    );
  }
  return poster.id;
}

describe("summarisePosters", () => {
  it("counts each poster's scans, including posters with none", async () => {
    const {
      campaignId,
      designIds: [first, second],
    } = await addCampaign(2);
    const a = await addPoster(first, 3);
    const b = await addPoster(first, 0);
    const c = await addPoster(second, 1);

    const counts = await lookup.summarisePosters(campaignId);
    expect(counts).toHaveLength(3);
    expect(counts).toEqual(
      expect.arrayContaining([
        {
          posterId: a,
          designId: first,
          posterName: null,
          location: null,
          scanCount: 3,
        },
        {
          posterId: b,
          designId: first,
          posterName: null,
          location: null,
          scanCount: 0,
        },
        {
          posterId: c,
          designId: second,
          posterName: null,
          location: null,
          scanCount: 1,
        },
      ]),
    );
  });

  it("ignores other campaigns' posters", async () => {
    const {
      campaignId,
      designIds: [design],
    } = await addCampaign(1);
    const other = await addCampaign(1);
    const a = await addPoster(design, 1);
    await addPoster(other.designIds[0], 2);

    expect(await lookup.summarisePosters(campaignId)).toEqual([
      {
        posterId: a,
        designId: design,
        posterName: null,
        location: null,
        scanCount: 1,
      },
    ]);
  });

  it("gives registered posters their poster name and unregistered ones none", async () => {
    const {
      campaignId,
      designIds: [design],
    } = await addCampaign(1);
    const registered = await addPoster(design, 2, "Corner café");
    const unregistered = await addPoster(design, 1);

    const counts = await lookup.summarisePosters(campaignId);
    expect(counts).toHaveLength(2);
    expect(counts).toEqual(
      expect.arrayContaining([
        {
          posterId: registered,
          designId: design,
          posterName: PosterName.create("Corner café"),
          location: null,
          scanCount: 2,
        },
        {
          posterId: unregistered,
          designId: design,
          posterName: null,
          location: null,
          scanCount: 1,
        },
      ]),
    );
  });

  it("gives located posters their location and other posters none", async () => {
    const {
      campaignId,
      designIds: [design],
    } = await addCampaign(1);
    const location = RegistrationLocation.create({
      latitude: 51.5072,
      longitude: -0.1276,
      accuracy: 12,
    });
    const located = await addPoster(design, 2, "Corner café", location);
    const unlocated = await addPoster(design, 1, "Station");
    const unregistered = await addPoster(design, 0);

    const counts = await lookup.summarisePosters(campaignId);
    const locationOf = new Map(
      counts.map(({ posterId, location }) => [posterId, location]),
    );
    expect(locationOf).toEqual(
      new Map([
        [located, location],
        [unlocated, null],
        [unregistered, null],
      ]),
    );
  });

  it("is empty for a campaign with no posters", async () => {
    const { campaignId } = await addCampaign(2);
    const other = await addCampaign(1);
    await addPoster(other.designIds[0], 1);
    expect(await lookup.summarisePosters(campaignId)).toEqual([]);
  });

  it("is empty for a campaign that doesn't exist", async () => {
    const { designIds } = await addCampaign(1);
    await addPoster(designIds[0], 1);
    expect(await lookup.summarisePosters(CampaignId.generate())).toEqual([]);
  });
});
