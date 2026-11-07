import { beforeEach, describe, expect, it } from "vitest";

import { ScanService } from "@application/services/ScanService";
import { CampaignTarget } from "@domain/campaign/CampaignTarget";
import { PosterId } from "@domain/poster/PosterId";

import { InMemoryScanTargetLookup } from "./fakes/InMemoryScanTargetLookup";

let lookup: InMemoryScanTargetLookup;
let service: ScanService;

beforeEach(() => {
  lookup = new InMemoryScanTargetLookup();
  service = new ScanService(lookup);
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
