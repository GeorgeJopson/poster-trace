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
import {
  OrphanedScanTargetCleanup,
  type ScanTargetKeys,
} from "@infrastructure/storage/OrphanedScanTargetCleanup";

import { A4_PDF_DETAILS } from "../../support/pdfs";
import { FakeBlobStore } from "./FakeBlobStore";
import { clearDatabase, db, insertUser } from "./testDb";

const alice = UserId.from("alice");

/** The copied targets' keys, in memory. */
class FakeScanTargetKeys implements ScanTargetKeys {
  readonly keys = new Set<string>();

  async list(): Promise<string[]> {
    return [...this.keys];
  }

  async delete(key: string): Promise<void> {
    this.keys.delete(key);
  }
}

let copies: FakeScanTargetKeys;
let cleanup: OrphanedScanTargetCleanup;

beforeEach(async () => {
  await clearDatabase();
  await insertUser(alice);
  copies = new FakeScanTargetKeys();
  cleanup = new OrphanedScanTargetCleanup(db, copies);
});

/** Stores `count` posters, with their targets copied, returning their ids. */
async function addPosters(count: number): Promise<string[]> {
  const campaign = Campaign.create(
    alice,
    "Campaign",
    CampaignTarget.create("https://example.com/"),
  );
  const design = campaign.addDesign(
    QrPlacement.create({ x: 0, y: 0, size: 10, rotation: 0 }),
    PosterDesignImage.create(new Blob(["pdf"]), A4_PDF_DETAILS),
  );
  await new DrizzleCampaignRepository(db, new FakeBlobStore()).save(campaign);
  const posters = Poster.generate(design.id, count);
  await new DrizzlePosterRepository(db).save(posters);
  for (const { id } of posters) copies.keys.add(id);
  return posters.map(({ id }) => id);
}

describe("run", () => {
  it("deletes the copies of posters that no longer exist, keeping the rest", async () => {
    const kept = await addPosters(2);
    const deleted = [PosterId.generate(), PosterId.generate()];
    for (const id of deleted) copies.keys.add(id);

    expect(await cleanup.run()).toBe(2);

    expect([...copies.keys].toSorted()).toEqual(kept.toSorted());
  });

  it("deletes a key that isn't a poster id at all", async () => {
    copies.keys.add("not-a-poster");

    expect(await cleanup.run()).toBe(1);

    expect(copies.keys.size).toBe(0);
  });

  it("checks posters in batches, so it copes with any number of copies", async () => {
    const kept = await addPosters(3);
    for (let i = 0; i < 2500; i++) copies.keys.add(PosterId.generate());

    expect(await cleanup.run()).toBe(2500);

    expect([...copies.keys].toSorted()).toEqual(kept.toSorted());
  });

  it("does nothing when there are no copies", async () => {
    expect(await cleanup.run()).toBe(0);
  });
});
