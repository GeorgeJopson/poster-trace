import type { PosterDesignId } from "@domain/campaign/design/PosterDesignId";
import type { PosterId } from "@domain/poster/PosterId";
import type { PosterName } from "@domain/poster/PosterName";

/** A poster, its poster name if it's registered, and its scan count. */
export type PosterScanCount = {
  posterId: PosterId;
  designId: PosterDesignId;
  /** `null` if the poster isn't registered. */
  posterName: PosterName | null;
  scanCount: number;
};

/**
 * Counts posters' scans for analytics. A read-only query, so stored scans are
 * counted in the database rather than loaded into posters (see ADR-0015).
 */
export interface ScanCountLookup {
  /**
   * The poster name and scan count of every poster of the designs, including
   * unregistered posters and posters with no scans, in no particular order.
   */
  countScansPerPoster(
    designIds: readonly PosterDesignId[],
  ): Promise<PosterScanCount[]>;
}
