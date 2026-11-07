import { getStore } from "@netlify/blobs";

import type { BlobStore, StoredBlob } from "./BlobStore";

// Not marked "server-only": the seed script (run with tsx) uses it too.

/** A site-wide Netlify Blobs store, so blobs survive across deploys. */
export class NetlifyBlobStore implements BlobStore {
  /** Where poster design images are kept. */
  static readonly POSTER_DESIGN_STORE = "poster-designs";

  /**
   * The store is shared by every deploy context, but deploy previews get
   * their own copy of the database. A delete from a preview could remove a
   * blob production still references, so only production deletes. Locally
   * (context "dev" under `netlify dev`, or "" outside it) the store is a
   * sandbox that's safe to delete from.
   */
  static deletesAllowedIn(netlifyContext?: string): boolean {
    return (
      !netlifyContext ||
      netlifyContext === "production" ||
      netlifyContext === "dev"
    );
  }

  /**
   * The poster design store, allowing deletes only where `deletesAllowedIn`
   * says. Shared by the app's container, the clean-up job and the seed
   * script.
   */
  static forPosterDesigns(): NetlifyBlobStore {
    return new NetlifyBlobStore(
      NetlifyBlobStore.POSTER_DESIGN_STORE,
      NetlifyBlobStore.deletesAllowedIn(process.env.NETLIFY_CONTEXT),
    );
  }

  constructor(
    private readonly storeName: string,
    private readonly deletesAllowed: boolean,
  ) {}

  async set(key: string, data: Blob, contentType: string): Promise<void> {
    await this.getStore().set(key, await data.arrayBuffer(), {
      metadata: { contentType, uploadedAt: new Date().toISOString() },
    });
  }

  async getStream(
    key: string,
  ): Promise<{ data: ReadableStream; contentType: string } | null> {
    const entry = await this.getStore().getWithMetadata(key, {
      type: "stream",
    });
    if (!entry) return null;
    return {
      data: entry.data,
      contentType: String(entry.metadata.contentType),
    };
  }

  /** Reads each blob's metadata, so it's one request per blob. */
  async list(): Promise<StoredBlob[]> {
    const store = this.getStore();
    const { blobs } = await store.list();
    const stored = await Promise.all(
      blobs.map(async ({ key }) => {
        const entry = await store.getMetadata(key);
        // Deleted since it was listed.
        if (!entry) return null;
        const { uploadedAt } = entry.metadata;
        return {
          key,
          uploadedAt:
            typeof uploadedAt === "string" ? new Date(uploadedAt) : null,
        };
      }),
    );
    return stored.filter((blob) => blob !== null);
  }

  async delete(key: string): Promise<void> {
    if (!this.deletesAllowed) return;
    await this.getStore().delete(key);
  }

  // Looked up on every call rather than once: getStore() reads the Blobs
  // credentials from the environment, and this class lives for the whole
  // process. Strong consistency so a blob can be read straight after it's
  // written.
  private getStore() {
    return getStore({ name: this.storeName, consistency: "strong" });
  }
}
