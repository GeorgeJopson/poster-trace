import { beforeEach, describe, expect, it, vi } from "vitest";

import { CampaignTarget } from "@domain/campaign/CampaignTarget";
import { PosterId } from "@domain/poster/PosterId";
import { NetlifyScanTargetCopy } from "@infrastructure/storage/NetlifyScanTargetCopy";

/** Stands in for Netlify Blobs: each store's entries, by its name and region. */
const fakeBlobs = vi.hoisted(() => ({
  stores: new Map<string, Map<string, string>>(),
}));

vi.mock("@netlify/blobs", () => ({
  getStore: ({ name, region }: { name: string; region?: string }) => {
    const id = `${region ?? "us-east-2"}/${name}`;
    const entries = fakeBlobs.stores.get(id) ?? new Map<string, string>();
    fakeBlobs.stores.set(id, entries);
    return {
      async set(key: string, value: string) {
        entries.set(key, value);
      },
    };
  },
}));

beforeEach(() => {
  fakeBlobs.stores.clear();
});

describe("NetlifyScanTargetCopy.storeName", () => {
  it.each([
    ["production", "scan-targets-production"],
    ["deploy-preview", "scan-targets-deploy-preview"],
    ["branch-deploy", "scan-targets-branch-deploy"],
    ["dev", "scan-targets-dev"],
    ["", "scan-targets-dev"],
    [undefined, "scan-targets-dev"],
  ])("names the store for %j %j", (context, name) => {
    expect(NetlifyScanTargetCopy.storeName(context)).toBe(name);
  });
});

describe("copy", () => {
  it("writes each poster's target, as text, to the store in its region", async () => {
    const ids = Array.from({ length: 45 }, () => PosterId.generate());

    await new NetlifyScanTargetCopy("scan-targets-production").copy(
      ids,
      CampaignTarget.create("https://example.com/"),
    );

    const store = fakeBlobs.stores.get("eu-central-1/scan-targets-production");
    expect(Object.fromEntries(store!)).toEqual(
      Object.fromEntries(ids.map((id) => [id, "https://example.com/"])),
    );
  });
});
