import { inArray } from "drizzle-orm";

import type { Db } from "../db/client";
import { posterDesign } from "../db/schema";
import type { BlobStore } from "./BlobStore";

/**
 * Deletes poster design images that no design points to: those of deleted
 * designs, campaigns and accounts, and uploads from saves that failed. It's
 * the only thing that deletes images (ADR-0013), and runs once a day.
 *
 * An image is only deleted once it's a day old, because `save` uploads a new
 * design's image before its row is committed. Images stored before upload
 * times were kept count as old.
 */
export class OrphanedDesignImageCleanup {
  static readonly GRACE_PERIOD_MS = 24 * 60 * 60 * 1000;

  constructor(
    private readonly db: Db,
    private readonly blobStore: BlobStore,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /** Returns how many images were deleted. */
  async run(): Promise<number> {
    const cutoff =
      this.now().getTime() - OrphanedDesignImageCleanup.GRACE_PERIOD_MS;
    // A blob listed here whose design commits after the query below looks
    // orphaned, which is what the grace period is for.
    const candidates = (await this.blobStore.list())
      .filter(({ uploadedAt }) => !uploadedAt || uploadedAt.getTime() <= cutoff)
      .map(({ key }) => key);
    if (candidates.length === 0) return 0;

    const designs = await this.db
      .select({ key: posterDesign.designImageKey })
      .from(posterDesign)
      .where(inArray(posterDesign.designImageKey, candidates));
    const inUse = new Set(designs.map(({ key }) => key));

    const orphans = candidates.filter((key) => !inUse.has(key));
    for (const key of orphans) {
      await this.blobStore.delete(key);
    }
    return orphans.length;
  }
}
