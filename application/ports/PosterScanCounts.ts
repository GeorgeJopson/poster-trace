import type { PosterDesignId } from "@domain/campaign/design/PosterDesignId";
import type { PosterId } from "@domain/poster/PosterId";

/** A poster and how many of its scans have been recorded. */
export type PosterScanCount = {
  posterId: PosterId;
  designId: PosterDesignId;
  scanCount: number;
};

/**
 * Counts posters' recorded scans. A read-only query, so scans are counted
 * where they're stored instead of being loaded into Posters (see ADR-0015).
 */
export interface PosterScanCounts {
  /**
   * Every poster of the designs with its scan count, including posters with
   * none, in no particular order. It never checks ownership: callers check
   * the designs belong to the user first.
   */
  countForDesigns(
    designIds: readonly PosterDesignId[],
  ): Promise<PosterScanCount[]>;
}
