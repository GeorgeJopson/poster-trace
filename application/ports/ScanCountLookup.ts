import type { PosterDesignId } from "@domain/campaign/design/PosterDesignId";
import type { PosterId } from "@domain/poster/PosterId";

/** A poster and its scan count. */
export type PosterScanCount = {
  posterId: PosterId;
  designId: PosterDesignId;
  scans: number;
};

/**
 * Counts posters' scans for analytics. A read-only query, so stored scans are
 * counted in the database rather than loaded into posters (see ADR-0015).
 */
export interface ScanCountLookup {
  /**
   * The scan count of every poster of the designs, including posters with no
   * scans, in no particular order.
   */
  countScansPerPoster(
    designIds: readonly PosterDesignId[],
  ): Promise<PosterScanCount[]>;
}
