import { beforeEach, describe, expect, it } from "vitest";

import { Campaign } from "@domain/campaign/Campaign";
import { CampaignTarget } from "@domain/campaign/CampaignTarget";
import { PosterDesignImage } from "@domain/campaign/design/PosterDesignImage";
import { QrPlacement } from "@domain/campaign/design/QrPlacement";
import { UserId } from "@domain/user/UserId";
import { DrizzleCampaignRepository } from "@infrastructure/repositories/DrizzleCampaignRepository";
import { OrphanedDesignImageCleanup } from "@infrastructure/storage/OrphanedDesignImageCleanup";

import { A4_PDF_DETAILS } from "../../support/pdfs";
import { FakeBlobStore } from "./FakeBlobStore";
import { clearDatabase, db, insertUser } from "./testDb";

const alice = UserId.from("alice");
const HOUR = 60 * 60 * 1000;
const START = new Date("2026-11-01T00:00:00Z");

let now: Date;
let blobStore: FakeBlobStore;
let repository: DrizzleCampaignRepository;
let cleanup: OrphanedDesignImageCleanup;

beforeEach(async () => {
  await clearDatabase();
  await insertUser(alice);
  now = START;
  blobStore = new FakeBlobStore(() => now);
  repository = new DrizzleCampaignRepository(db, blobStore);
  cleanup = new OrphanedDesignImageCleanup(db, blobStore, () => now);
});

/** Saves a campaign with one design, whose image is stored now. */
async function addDesign() {
  const campaign = Campaign.create(
    alice,
    "Campaign",
    CampaignTarget.create("https://example.com/"),
  );
  campaign.addDesign(
    QrPlacement.create({ x: 0, y: 0, size: 10, rotation: 0 }),
    PosterDesignImage.create(new Blob(["pdf"]), A4_PDF_DETAILS),
  );
  await repository.save(campaign);
  return campaign;
}

async function addOrphan(key: string) {
  await blobStore.set(key, new Blob(["orphan"]), "application/pdf");
}

const after = (hours: number) => new Date(START.getTime() + hours * HOUR);

describe("OrphanedDesignImageCleanup.run", () => {
  it("deletes images no design points to once they're a day old", async () => {
    await addOrphan("orphan");
    now = after(24);

    expect(await cleanup.run()).toBe(1);
    expect(blobStore.blobs.has("orphan")).toBe(false);
  });

  it("keeps images that designs point to, however old", async () => {
    await addDesign();
    const [key] = blobStore.blobs.keys();
    now = after(24 * 30);

    expect(await cleanup.run()).toBe(0);
    expect([...blobStore.blobs.keys()]).toEqual([key]);
  });

  it("keeps orphans less than a day old, which a save may be about to use", async () => {
    await addOrphan("recent");
    now = after(23);

    expect(await cleanup.run()).toBe(0);
    expect(blobStore.blobs.has("recent")).toBe(true);
  });

  it("treats an orphan with no upload time as old", async () => {
    await addOrphan("undated");
    blobStore.blobs.get("undated")!.uploadedAt = null;

    expect(await cleanup.run()).toBe(1);
    expect(blobStore.blobs.size).toBe(0);
  });

  it("deletes a deleted account's images", async () => {
    await addDesign();
    await clearDatabase();
    now = after(24);

    expect(await cleanup.run()).toBe(1);
    expect(blobStore.blobs.size).toBe(0);
  });

  it("deletes only the old orphans in a mixed store", async () => {
    await addDesign();
    const [inUse] = blobStore.blobs.keys();
    await addOrphan("old");
    now = after(12);
    await addOrphan("recent");
    now = after(30);

    expect(await cleanup.run()).toBe(1);
    expect([...blobStore.blobs.keys()].sort()).toEqual(
      [inUse, "recent"].sort(),
    );
  });

  it("does nothing when the store is empty", async () => {
    expect(await cleanup.run()).toBe(0);
  });
});
