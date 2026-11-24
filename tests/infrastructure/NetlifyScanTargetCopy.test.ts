import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CampaignTarget } from "@domain/campaign/CampaignTarget";
import { PosterId } from "@domain/poster/PosterId";
import { NetlifyScanTargetCopy } from "@infrastructure/storage/NetlifyScanTargetCopy";

/**
 * Stands in for Netlify Blobs. Each store's entries are kept under where
 * they'd really live: a site-wide store by its region and name (us-east-2
 * if no region is given), a deploy store by its name alone.
 */
const fakeBlobs = vi.hoisted(() => ({
  stores: new Map<string, Map<string, string>>(),
  inFlight: 0,
  maxInFlight: 0,
}));

vi.mock("@netlify/blobs", () => {
  function store(id: string) {
    const entries = fakeBlobs.stores.get(id) ?? new Map<string, string>();
    fakeBlobs.stores.set(id, entries);
    return {
      async set(key: string, value: string) {
        fakeBlobs.inFlight += 1;
        fakeBlobs.maxInFlight = Math.max(
          fakeBlobs.maxInFlight,
          fakeBlobs.inFlight,
        );
        await new Promise((resolve) => setTimeout(resolve, 1));
        entries.set(key, value);
        fakeBlobs.inFlight -= 1;
        return { modified: true };
      },
      // Pages of two keys, as Blobs pages large stores.
      async *list({ paginate }: { paginate: true }) {
        if (!paginate) throw new Error("Only paged listing is faked");
        const keys = [...entries.keys()];
        for (let i = 0; i < keys.length; i += 2) {
          yield {
            blobs: keys.slice(i, i + 2).map((key) => ({ key })),
            directories: [],
          };
        }
      },
      async delete(key: string) {
        entries.delete(key);
      },
    };
  }
  return {
    getStore: ({ name, region }: { name: string; region?: string }) =>
      store(`site:${region ?? "us-east-2"}/${name}`),
    getDeployStore: ({ name }: { name: string }) => store(`deploy:${name}`),
  };
});

beforeEach(() => {
  fakeBlobs.stores.clear();
  fakeBlobs.maxInFlight = 0;
});

afterEach(() => {
  vi.unstubAllEnvs();
});

const TARGET = CampaignTarget.create("https://example.com/");

/** Copies the target of `count` new posters in `context`, returning their ids. */
async function copyIn(context: string, count = 3) {
  vi.stubEnv("NETLIFY_CONTEXT", context);
  const ids = Array.from({ length: count }, () => PosterId.generate());
  await NetlifyScanTargetCopy.forThisContext().copy(ids, TARGET);
  return ids;
}

function entries(storeId: string) {
  return Object.fromEntries(fakeBlobs.stores.get(storeId) ?? []);
}

describe("copy", () => {
  it("in production, writes each poster's target as text to the site-wide store in eu-central-1", async () => {
    const ids = await copyIn("production");

    expect(entries("site:eu-central-1/scan-targets-production")).toEqual(
      Object.fromEntries(ids.map((id) => [id, "https://example.com/"])),
    );
    expect([...fakeBlobs.stores.keys()]).toEqual([
      "site:eu-central-1/scan-targets-production",
    ]);
  });

  it.each(["deploy-preview", "branch-deploy", "dev", ""])(
    "in %j, writes to the deploy's own store, as its database is its own",
    async (context) => {
      const ids = await copyIn(context);

      expect(entries("deploy:scan-targets")).toEqual(
        Object.fromEntries(ids.map((id) => [id, "https://example.com/"])),
      );
      expect([...fakeBlobs.stores.keys()]).toEqual(["deploy:scan-targets"]);
    },
  );

  it("sends at most 20 writes at once", async () => {
    const ids = await copyIn("production", 45);

    expect(
      Object.keys(entries("site:eu-central-1/scan-targets-production")),
    ).toHaveLength(ids.length);
    expect(fakeBlobs.maxInFlight).toBe(20);
  });
});

describe("list and delete", () => {
  it("lists every copied poster id, across pages, and deletes one", async () => {
    const ids = await copyIn("production", 5);
    const copy = new NetlifyScanTargetCopy("production");

    expect((await copy.list()).toSorted()).toEqual(ids.toSorted());

    await copy.delete(ids[0]);
    expect((await copy.list()).toSorted()).toEqual(ids.slice(1).toSorted());
  });
});
