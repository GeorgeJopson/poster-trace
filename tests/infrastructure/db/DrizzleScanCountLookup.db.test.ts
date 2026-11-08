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
import { DrizzleScanCountLookup } from "@infrastructure/repositories/DrizzleScanCountLookup";

import { A4_PDF_DETAILS } from "../../support/pdfs";
import { FakeBlobStore } from "./FakeBlobStore";
import { clearDatabase, db, insertUser } from "./testDb";

const alice = UserId.from("alice");

let posters: DrizzlePosterRepository;
let lookup: DrizzleScanCountLookup;

beforeEach(async () => {
  await clearDatabase();
  await insertUser(alice);
  posters = new DrizzlePosterRepository(db);
  lookup = new DrizzleScanCountLookup(db);
});

/** Stores a campaign with `count` designs, returning their ids. */
async function addDesigns(count: number): Promise<PosterDesignId[]> {
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
  return designs.map((design) => design.id);
}

/** Stores a poster of the design with `scanCount` scans. */
async function addPoster(designId: PosterDesignId, scanCount: number) {
  const [poster] = Poster.generate(designId, 1);
  await posters.addAll([poster]);
  for (let i = 0; i < scanCount; i++) poster.addScan(new Date());
  await posters.addNewScans(poster);
  return poster.id;
}

describe("countScansPerPoster", () => {
  it("counts each poster's scans, including posters with none", async () => {
    const [first, second] = await addDesigns(2);
    const a = await addPoster(first, 3);
    const b = await addPoster(first, 0);
    const c = await addPoster(second, 1);

    const counts = await lookup.countScansPerPoster([first, second]);
    expect(counts).toHaveLength(3);
    expect(counts).toEqual(
      expect.arrayContaining([
        { posterId: a, designId: first, scanCount: 3 },
        { posterId: b, designId: first, scanCount: 0 },
        { posterId: c, designId: second, scanCount: 1 },
      ]),
    );
  });

  it("ignores posters of designs it wasn't given", async () => {
    const [first, second] = await addDesigns(2);
    const a = await addPoster(first, 1);
    await addPoster(second, 2);

    expect(await lookup.countScansPerPoster([first])).toEqual([
      { posterId: a, designId: first, scanCount: 1 },
    ]);
  });

  it("is empty when given no designs", async () => {
    const [design] = await addDesigns(1);
    await addPoster(design, 1);
    expect(await lookup.countScansPerPoster([])).toEqual([]);
  });
});
