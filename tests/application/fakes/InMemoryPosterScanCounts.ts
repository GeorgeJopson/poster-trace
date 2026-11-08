import type {
  PosterScanCount,
  PosterScanCounts,
} from "@application/ports/PosterScanCounts";
import type { PosterDesignId } from "@domain/campaign/design/PosterDesignId";

import type { InMemoryPosterRepository } from "./InMemoryPosterRepository";

/** Behaves like DrizzlePosterScanCounts, over a fake repository's posters. */
export class InMemoryPosterScanCounts implements PosterScanCounts {
  constructor(private readonly posters: InMemoryPosterRepository) {}

  async countForDesigns(
    designIds: readonly PosterDesignId[],
  ): Promise<PosterScanCount[]> {
    return this.posters.posters
      .filter(({ designId }) => designIds.includes(designId))
      .map(({ id, designId }) => ({
        posterId: id,
        designId,
        scanCount: this.posters.scans.filter(({ posterId }) => posterId === id)
          .length,
      }));
  }
}
