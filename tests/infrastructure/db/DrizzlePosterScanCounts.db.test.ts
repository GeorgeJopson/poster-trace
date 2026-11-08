import { beforeEach, describe, expect, it } from "vitest";

import { Campaign } from "@domain/campaign/Campaign";
import { CampaignTarget } from "@domain/campaign/CampaignTarget";
import type { PosterDesignId } from "@domain/campaign/design/PosterDesignId";
import { PosterDesignImage } from "@domain/campaign/design/PosterDesignImage";
import { QrPlacement } from "@domain/campaign/design/QrPlacement";
import { Poster } from "@domain/poster/Poster";
import { UserId } from "@domain/user/UserId";
import { DrizzleCampaignRepository } from "@infrastructure/repositories/DrizzleCampaignRepository";
import { DrizzlePosterRepository } from "@infrastructure/repositories/DrizzlePosterRepository";
import { DrizzlePosterScanCounts } from "@infrastructure/repositories/DrizzlePosterScanCounts";

import { A4_PDF_DETAILS } from "../../support/pdfs";
import { FakeBlobStore } from "./FakeBlobStore";
import { clearDatabase, db, insertUser } from "./testDb";

const alice = UserId.from("alice");

let posters: DrizzlePosterRepository;
let counts: DrizzlePosterScanCounts;
let designId: PosterDesignId;
let otherDesignId: PosterDesignId;

beforeEach(async () => {
  await clearDatabase();
  await insertUser(alice);
  const campaign = Campaign.create(
    alice,
    "Campaign",
    CampaignTarget.create("https://example.com/"),
  );
  const addDesign = () =>
    campaign.addDesign(
      QrPlacement.create({ x: 10, y: 10, size: 20, rotation: 0 }),
      PosterDesignImage.create(new Blob(["pdf"]), A4_PDF_DETAILS),
    ).id;
  designId = addDesign();
  otherDesignId = addDesign();
  await new DrizzleCampaignRepository(db, new FakeBlobStore()).save(campaign);
  posters = new DrizzlePosterRepository(db);
  counts = new DrizzlePosterScanCounts(db);
});

/** Stores a poster of the design with `scanCount` scans. */
async function addPoster(design: PosterDesignId, scanCount: number) {
  const [poster] = Poster.generate(design, 1);
  await posters.addAll([poster]);
  for (let i = 0; i < scanCount; i++) {
    poster.addScan(new Date());
  }
  await posters.addNewScans(poster);
  return poster;
}

describe("countForDesigns", () => {
  it("counts each poster's scans, including posters with none", async () => {
    const scanned = await addPoster(designId, 3);
    const unscanned = await addPoster(designId, 0);

    expect(await counts.countForDesigns([designId])).toEqual(
      expect.arrayContaining([
        { posterId: scanned.id, designId, scanCount: 3 },
        { posterId: unscanned.id, designId, scanCount: 0 },
      ]),
    );
    expect(await counts.countForDesigns([designId])).toHaveLength(2);
  });

  it("counts the posters of every design asked for, and no others", async () => {
    const poster = await addPoster(designId, 1);
    const otherPoster = await addPoster(otherDesignId, 4);

    expect(await counts.countForDesigns([designId])).toEqual([
      { posterId: poster.id, designId, scanCount: 1 },
    ]);
    expect(
      await counts.countForDesigns([designId, otherDesignId]),
    ).toHaveLength(2);
    expect(await counts.countForDesigns([otherDesignId])).toEqual([
      { posterId: otherPoster.id, designId: otherDesignId, scanCount: 4 },
    ]);
  });

  it("returns nothing for no designs", async () => {
    await addPoster(designId, 1);
    expect(await counts.countForDesigns([])).toEqual([]);
  });
});
