import { beforeEach, describe, expect, it } from "vitest";

import { Campaign } from "@domain/campaign/Campaign";
import { CampaignTarget } from "@domain/campaign/CampaignTarget";
import { PosterDesignImage } from "@domain/campaign/design/PosterDesignImage";
import { QrPlacement } from "@domain/campaign/design/QrPlacement";
import { Poster } from "@domain/poster/Poster";
import { PosterId } from "@domain/poster/PosterId";
import { UserId } from "@domain/user/UserId";
import { DrizzleCampaignRepository } from "@infrastructure/repositories/DrizzleCampaignRepository";
import { DrizzlePosterRepository } from "@infrastructure/repositories/DrizzlePosterRepository";
import { DrizzleScanTargetLookup } from "@infrastructure/repositories/DrizzleScanTargetLookup";

import { A4_PDF_DETAILS } from "../../support/pdfs";
import { FakeBlobStore } from "./FakeBlobStore";
import { clearDatabase, db, insertUser } from "./testDb";

const alice = UserId.from("alice");

let campaigns: DrizzleCampaignRepository;
let lookup: DrizzleScanTargetLookup;

beforeEach(async () => {
  await clearDatabase();
  await insertUser(alice);
  campaigns = new DrizzleCampaignRepository(db, new FakeBlobStore());
  lookup = new DrizzleScanTargetLookup(db);
});

/** Stores a campaign with one design, and `count` posters of that design. */
async function addPosters(target: string, count = 1) {
  const campaign = Campaign.create(
    alice,
    "Campaign",
    CampaignTarget.create(target),
  );
  const design = campaign.addDesign(
    QrPlacement.create({ x: 10, y: 10, size: 20, rotation: 0 }),
    PosterDesignImage.create(new Blob(["pdf"]), A4_PDF_DETAILS),
  );
  await campaigns.save(campaign);
  const posters = Poster.generate(design.id, count);
  await new DrizzlePosterRepository(db).addAll(posters);
  return { campaign, posters };
}

describe("findTarget", () => {
  it("finds the target of the poster's campaign", async () => {
    await addPosters("https://example.com/other");
    const { posters } = await addPosters("https://example.com/", 2);

    for (const poster of posters) {
      const target = await lookup.findTarget(poster.id);
      expect(target?.value).toBe("https://example.com/");
    }
  });

  it("finds the campaign's current target after it changes", async () => {
    const { campaign, posters } = await addPosters("https://example.com/");
    campaign.setTarget(CampaignTarget.create("https://example.com/new"));
    await campaigns.save(campaign);

    const target = await lookup.findTarget(posters[0].id);
    expect(target?.value).toBe("https://example.com/new");
  });

  it("returns null for an unknown poster", async () => {
    await addPosters("https://example.com/");
    expect(await lookup.findTarget(PosterId.generate())).toBeNull();
  });

  it("returns null once the poster is deleted with its owner", async () => {
    const { posters } = await addPosters("https://example.com/");
    await clearDatabase();
    expect(await lookup.findTarget(posters[0].id)).toBeNull();
  });
});
