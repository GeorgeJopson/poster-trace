import type {
  PosterScanCount,
  ScanCountLookup,
} from "@application/ports/ScanCountLookup";
import type { PosterDesignId } from "@domain/campaign/design/PosterDesignId";
import { PosterName } from "@domain/poster/PosterName";
import { RegistrationLocation } from "@domain/poster/RegistrationLocation";

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
      .map(({ id, designId }) => {
        const registration = this.posters.registrations.find(
          ({ posterId }) => posterId === id,
        );
        return {
          posterId: id,
          designId,
          posterName: registration
            ? PosterName.create(registration.posterName)
            : null,
          location: registration?.location
            ? RegistrationLocation.create(registration.location)
            : null,
          scanCount: this.scans.stored.filter(({ posterId }) => posterId === id)
            .length,
        };
      });
  }
}
