import { describe, expect, it } from "vitest";

import { NetlifyBlobStore } from "@infrastructure/storage/NetlifyBlobStore";

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
