import { beforeEach, describe, expect, it } from "vitest";

import { Campaign } from "@domain/campaign/Campaign";
import { CampaignId } from "@domain/campaign/CampaignId";
import { CampaignTarget } from "@domain/campaign/CampaignTarget";
import type { PosterDesignId } from "@domain/campaign/design/PosterDesignId";
import { PosterDesignImage } from "@domain/campaign/design/PosterDesignImage";
import { QrPlacement } from "@domain/campaign/design/QrPlacement";
import { Poster } from "@domain/poster/Poster";
import type { PosterId } from "@domain/poster/PosterId";
import { UserId } from "@domain/user/UserId";
import { DrizzleCampaignPosterLookup } from "@infrastructure/repositories/DrizzleCampaignPosterLookup";
import { DrizzleCampaignRepository } from "@infrastructure/repositories/DrizzleCampaignRepository";
import { DrizzlePosterRepository } from "@infrastructure/repositories/DrizzlePosterRepository";

import { A4_PDF_DETAILS } from "../../support/pdfs";
import { FakeBlobStore } from "./FakeBlobStore";
import { clearDatabase, db, insertUser } from "./testDb";

const alice = UserId.from("alice");

let lookup: DrizzleCampaignPosterLookup;

beforeEach(async () => {
  await clearDatabase();
  await insertUser(alice);
  lookup = new DrizzleCampaignPosterLookup(db);
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

/** Stores `count` posters of the design, returning their ids. */
async function addPosters(
  designId: PosterDesignId,
  count: number,
): Promise<PosterId[]> {
  const posters = Poster.generate(designId, count);
  await new DrizzlePosterRepository(db).save(posters);
  return posters.map((poster) => poster.id);
}

describe("listPosterIds", () => {
  it("lists the posters of every design of the campaign", async () => {
    const { campaignId, designIds } = await addCampaign(2);
    const ids = [
      ...(await addPosters(designIds[0], 2)),
      ...(await addPosters(designIds[1], 1)),
    ];
    const other = await addCampaign(1);
    await addPosters(other.designIds[0], 1);

    const listed = await lookup.listPosterIds(campaignId);

    expect(listed.toSorted()).toEqual(ids.toSorted());
  });

  it("is empty for a campaign with no posters, or that doesn't exist", async () => {
    const { campaignId } = await addCampaign(1);

    expect(await lookup.listPosterIds(campaignId)).toEqual([]);
    expect(await lookup.listPosterIds(CampaignId.generate())).toEqual([]);
  });
});
