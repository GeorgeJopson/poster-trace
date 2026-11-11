import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ScanService } from "@application/services/ScanService";
import { CampaignTarget } from "@domain/campaign/CampaignTarget";
import { PosterDesignId } from "@domain/campaign/design/PosterDesignId";
import { Poster } from "@domain/poster/Poster";
import { PosterId } from "@domain/poster/PosterId";

import { InMemoryPosterRepository } from "./fakes/InMemoryPosterRepository";
import { InMemoryScanRepository } from "./fakes/InMemoryScanRepository";
import { InMemoryScanTargetLookup } from "./fakes/InMemoryScanTargetLookup";

let lookup: InMemoryScanTargetLookup;
let posters: InMemoryPosterRepository;
let scans: InMemoryScanRepository;
let service: ScanService;

beforeEach(() => {
  lookup = new InMemoryScanTargetLookup();
  posters = new InMemoryPosterRepository();
  scans = new InMemoryScanRepository(posters);
  service = new ScanService(lookup, scans);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("findTarget", () => {
  it("returns the target a scan of the poster sends the scanner to", async () => {
    const posterId = PosterId.generate();
    lookup.addPoster(posterId, CampaignTarget.create("https://example.com/"));

    expect(await service.findTarget(posterId)).toBe("https://example.com/");
  });

  it.each([
    ["an unknown poster id", () => PosterId.generate()],
    ["a non-UUID poster id", () => "not-a-uuid"],
    ["an empty poster id", () => ""],
  ])("returns null for %s", async (_case, posterId) => {
    expect(await service.findTarget(posterId())).toBeNull();
  });
});

describe("recordScan", () => {
  const scannedAt = new Date("2026-11-07T12:00:00Z");

  async function storedPoster() {
    const [poster] = Poster.generate(PosterDesignId.generate(), 1);
    await posters.addAll([poster]);
    return poster;
  }

  it("records a scan of the poster at the time it happened", async () => {
    const poster = await storedPoster();

    await service.recordScan(poster.id, scannedAt);

    expect(scans.stored).toEqual([
      { id: expect.any(String), posterId: poster.id, scannedAt },
    ]);
  });

  it("records every scan, including repeats", async () => {
    const poster = await storedPoster();

    await service.recordScan(poster.id, scannedAt);
    await service.recordScan(poster.id, scannedAt);

    expect(scans.stored).toHaveLength(2);
  });

  it.each([
    ["an unknown poster id", () => PosterId.generate()],
    ["a non-UUID poster id", () => "not-a-uuid"],
  ])("records nothing for %s", async (_case, posterId) => {
    await service.recordScan(posterId(), scannedAt);
    expect(scans.stored).toEqual([]);
  });

  it("logs a scan it couldn't record instead of throwing", async () => {
    const poster = await storedPoster();
    const failure = new Error("database is down");
    vi.spyOn(scans, "add").mockRejectedValue(failure);
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      service.recordScan(poster.id, scannedAt),
    ).resolves.toBeUndefined();
    expect(log).toHaveBeenCalledWith(expect.any(String), failure);
  });
});
