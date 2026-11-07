import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { NetlifyBlobStore } from "@infrastructure/storage/NetlifyBlobStore";

type Metadata = Record<string, unknown>;

/** Stands in for a Netlify Blobs store; `metadata` reads as `null` once deleted. */
const fakeStore = vi.hoisted(() => ({
  entries: new Map<string, { data: ArrayBuffer; metadata: Metadata }>(),
  // Keys listed, whether or not they've been deleted since.
  listed: [] as string[],
}));

vi.mock("@netlify/blobs", () => ({
  getStore: () => ({
    async set(
      key: string,
      data: ArrayBuffer,
      { metadata }: { metadata: Metadata },
    ) {
      fakeStore.entries.set(key, { data, metadata });
    },
    async list() {
      return { blobs: fakeStore.listed.map((key) => ({ key })) };
    },
    async getMetadata(key: string) {
      const entry = fakeStore.entries.get(key);
      return entry ? { metadata: entry.metadata } : null;
    },
    async delete(key: string) {
      fakeStore.entries.delete(key);
    },
  }),
}));

beforeEach(() => {
  fakeStore.entries.clear();
  fakeStore.listed = [];
});

describe("NetlifyBlobStore.deletesAllowedIn", () => {
  it.each([undefined, "", "dev", "production"])(
    "allows deletes in %j",
    (context) => {
      expect(NetlifyBlobStore.deletesAllowedIn(context)).toBe(true);
    },
  );

  it.each(["deploy-preview", "branch-deploy"])(
    "doesn't allow deletes in %j, which shares production's store",
    (context) => {
      expect(NetlifyBlobStore.deletesAllowedIn(context)).toBe(false);
    },
  );
});

describe("NetlifyBlobStore.delete", () => {
  it("does nothing when deletes aren't allowed", async () => {
    // Without a Blobs environment, any store access would throw.
    const store = new NetlifyBlobStore("test", false);
    await expect(store.delete("key")).resolves.toBeUndefined();
  });
});

describe("NetlifyBlobStore.forPosterDesigns", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  async function storeAndDeleteIn(context: string) {
    vi.stubEnv("NETLIFY_CONTEXT", context);
    const store = NetlifyBlobStore.forPosterDesigns();
    await store.set("key", new Blob(["x"]), "application/pdf");
    await store.delete("key");
  }

  it("deletes in production", async () => {
    await storeAndDeleteIn("production");
    expect(fakeStore.entries.has("key")).toBe(false);
  });

  it.each(["deploy-preview", "branch-deploy"])(
    "doesn't delete in %j, which shares production's store",
    async (context) => {
      await storeAndDeleteIn(context);
      expect(fakeStore.entries.has("key")).toBe(true);
    },
  );
});

describe("NetlifyBlobStore.set", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("stores the content type and upload time in the metadata", async () => {
    vi.useFakeTimers({ now: new Date("2026-11-01T12:00:00Z") });
    const store = new NetlifyBlobStore("test", true);

    await store.set("key", new Blob(["bytes"]), "application/pdf");

    expect(fakeStore.entries.get("key")?.metadata).toEqual({
      contentType: "application/pdf",
      uploadedAt: "2026-11-01T12:00:00.000Z",
    });
  });
});

describe("NetlifyBlobStore.list", () => {
  it("returns each blob's upload time, as a Date", async () => {
    const store = new NetlifyBlobStore("test", true);
    fakeStore.entries.set("dated", {
      data: new ArrayBuffer(0),
      metadata: { uploadedAt: "2026-11-01T12:00:00.000Z" },
    });
    fakeStore.listed = ["dated"];

    expect(await store.list()).toEqual([
      { key: "dated", uploadedAt: new Date("2026-11-01T12:00:00Z") },
    ]);
  });

  it("gives blobs stored without an upload time a null one", async () => {
    const store = new NetlifyBlobStore("test", true);
    fakeStore.entries.set("undated", {
      data: new ArrayBuffer(0),
      metadata: { contentType: "application/pdf" },
    });
    fakeStore.listed = ["undated"];

    expect(await store.list()).toEqual([{ key: "undated", uploadedAt: null }]);
  });

  it("leaves out blobs deleted since they were listed", async () => {
    const store = new NetlifyBlobStore("test", true);
    await store.set("kept", new Blob(["x"]), "application/pdf");
    fakeStore.listed = ["kept", "gone"];

    expect((await store.list()).map(({ key }) => key)).toEqual(["kept"]);
  });
});
