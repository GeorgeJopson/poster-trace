import { beforeEach, describe, expect, it } from "vitest";

import { Campaign } from "@domain/campaign/Campaign";
import { CampaignTarget } from "@domain/campaign/CampaignTarget";
import { PosterDesignImage } from "@domain/campaign/design/PosterDesignImage";
import { QrPlacement } from "@domain/campaign/design/QrPlacement";
import { Poster } from "@domain/poster/Poster";
import { PosterId } from "@domain/poster/PosterId";
import { Scan } from "@domain/scan/Scan";
import { UserId } from "@domain/user/UserId";
import { scan as scanTable } from "@infrastructure/db/schema";
import { DrizzleCampaignRepository } from "@infrastructure/repositories/DrizzleCampaignRepository";
import { DrizzlePosterRepository } from "@infrastructure/repositories/DrizzlePosterRepository";
import { DrizzleScanRepository } from "@infrastructure/repositories/DrizzleScanRepository";

import { A4_PDF_DETAILS } from "../../support/pdfs";
import { FakeBlobStore } from "./FakeBlobStore";
import { clearDatabase, db, insertUser } from "./testDb";

const alice = UserId.from("alice");
const scannedAt = new Date("2026-11-07T12:34:56.789Z");

let repository: DrizzleScanRepository;
let posterId: PosterId;

beforeEach(async () => {
  await clearDatabase();
  await insertUser(alice);
  const campaign = Campaign.create(
    alice,
    "Campaign",
    CampaignTarget.create("https://example.com/"),
  );
  const design = campaign.addDesign(
    QrPlacement.create({ x: 10, y: 10, size: 20, rotation: 0 }),
    PosterDesignImage.create(new Blob(["pdf"]), A4_PDF_DETAILS),
  );
  await new DrizzleCampaignRepository(db, new FakeBlobStore()).save(campaign);
  const [poster] = Poster.generate(design.id, 1);
  await new DrizzlePosterRepository(db).addAll([poster]);
  posterId = poster.id;
  repository = new DrizzleScanRepository(db);
});

// The repository can't read scans back, so these check the rows directly.
async function storedScans() {
  return db
    .select({
      id: scanTable.id,
      posterId: scanTable.posterId,
      scannedAt: scanTable.scannedAt,
    })
    .from(scanTable);
}

describe("add", () => {
  it("stores the scan under the domain's id, at its time", async () => {
    const scan = Scan.record(posterId, scannedAt);

    await repository.add(scan);

    expect(await storedScans()).toEqual([{ id: scan.id, posterId, scannedAt }]);
  });

  it("keeps the scans already stored", async () => {
    await repository.add(Scan.record(posterId, scannedAt));
    await repository.add(Scan.record(posterId, scannedAt));

    expect(await storedScans()).toHaveLength(2);
  });

  it("stores nothing, without throwing, for a poster that isn't stored", async () => {
    await expect(
      repository.add(Scan.record(PosterId.generate(), scannedAt)),
    ).resolves.toBeUndefined();
    expect(await storedScans()).toEqual([]);
  });

  it("fails for a scan that's already stored", async () => {
    const scan = Scan.record(posterId, scannedAt);
    await repository.add(scan);

    await expect(repository.add(scan)).rejects.toThrow();
    expect(await storedScans()).toHaveLength(1);
  });

  it("is deleted with the poster's owner", async () => {
    await repository.add(Scan.record(posterId, scannedAt));

    await clearDatabase();

    expect(await storedScans()).toEqual([]);
  });
});
