import type {
  PosterScanCount,
  ScanCountLookup,
} from "@application/ports/ScanCountLookup";
import type { PosterDesignId } from "@domain/campaign/design/PosterDesignId";

import type { InMemoryPosterRepository } from "./InMemoryPosterRepository";

/** Behaves like DrizzleScanCountLookup, over a poster repository's contents. */
export class InMemoryScanCountLookup implements ScanCountLookup {
  constructor(private readonly posters: InMemoryPosterRepository) {}

  async countScansPerPoster(
    designIds: readonly PosterDesignId[],
  ): Promise<PosterScanCount[]> {
    return this.posters.posters
      .filter(({ designId }) => designIds.includes(designId))
      .map(({ id, designId }) => ({
        posterId: id,
        designId,
        scans: this.posters.scans.filter(({ posterId }) => posterId === id)
          .length,
      }));
  }
}
