import { beforeEach, describe, expect, it } from "vitest";

import { Poster } from "@domain/poster/Poster";
import { PosterId } from "@domain/poster/PosterId";
import { Scan } from "@domain/scan/Scan";
import { UserId } from "@domain/user/UserId";
import { scan as scanTable } from "@infrastructure/db/schema";
import { DrizzlePosterRepository } from "@infrastructure/repositories/DrizzlePosterRepository";
import { DrizzleScanRepository } from "@infrastructure/repositories/DrizzleScanRepository";

import { clearDatabase, db, insertDesign, insertUser } from "./testDb";

const alice = UserId.from("alice");
const scannedAt = new Date("2026-11-07T12:34:56.789Z");

let repository: DrizzleScanRepository;
let posterId: PosterId;

beforeEach(async () => {
  await clearDatabase();
  await insertUser(alice);
  const [poster] = Poster.generate(await insertDesign(alice), 1);
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
