import type {
  PosterScanCount,
  ScanCountLookup,
} from "@application/ports/ScanCountLookup";
import type { PosterDesignId } from "@domain/campaign/design/PosterDesignId";

import type { InMemoryPosterRepository } from "./InMemoryPosterRepository";
import type { InMemoryScanRepository } from "./InMemoryScanRepository";

/** Behaves like DrizzleScanCountLookup, over the repositories' contents. */
export class InMemoryScanCountLookup implements ScanCountLookup {
  constructor(
    private readonly posters: InMemoryPosterRepository,
    private readonly scans: InMemoryScanRepository,
  ) {}

  async countScansPerPoster(
    designIds: readonly PosterDesignId[],
  ): Promise<PosterScanCount[]> {
    return this.posters.posters
      .filter(({ designId }) => designIds.includes(designId))
      .map(({ id, designId }) => ({
        posterId: id,
        designId,
        scanCount: this.scans.stored.filter(({ posterId }) => posterId === id)
          .length,
      }));
  }
}
