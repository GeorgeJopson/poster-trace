import type { PosterDesignId } from "@domain/campaign/design/PosterDesignId";
import { Poster } from "@domain/poster/Poster";
import type { PosterId } from "@domain/poster/PosterId";
import type { PosterRepository } from "@domain/poster/PosterRepository";
import type { ScanId } from "@domain/poster/ScanId";

/** Behaves like DrizzlePosterRepository, storing copies of the posters. */
export class InMemoryPosterRepository implements PosterRepository {
  // In insertion order, like ordering by created_at.
  readonly posters: { id: PosterId; designId: PosterDesignId }[] = [];
  readonly scans: { id: ScanId; posterId: PosterId; scannedAt: Date }[] = [];

  async addAll(posters: readonly Poster[]): Promise<void> {
    this.posters.push(...posters.map(({ id, designId }) => ({ id, designId })));
  }

  async findById(id: PosterId): Promise<Poster | null> {
    const stored = this.posters.find((poster) => poster.id === id);
    return stored ? Poster.restore(stored) : null;
  }

  async addNewScans(poster: Poster): Promise<void> {
    if (!this.posters.some(({ id }) => id === poster.id)) {
      // Like the scan table's foreign key.
      throw new Error(`No poster ${poster.id}`);
    }
    // Only inserts, so a duplicate id fails like the primary key would.
    for (const scan of poster.newScans) {
      if (this.scans.some(({ id }) => id === scan.id)) {
        throw new Error(`Duplicate scan ${scan.id}`);
      }
    }
    this.scans.push(
      ...poster.newScans.map(({ id, scannedAt }) => ({
        id,
        posterId: poster.id,
        scannedAt,
      })),
    );
  }
}
