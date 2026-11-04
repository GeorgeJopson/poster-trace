import type { Poster } from "@domain/poster/Poster";
import type { PosterRepository } from "@domain/poster/PosterRepository";

/** Behaves like DrizzlePosterRepository, storing copies of the posters. */
export class InMemoryPosterRepository implements PosterRepository {
  // In insertion order, like ordering by created_at.
  readonly posters: { id: string; designId: string }[] = [];

  async addAll(posters: readonly Poster[]): Promise<void> {
    this.posters.push(...posters.map(({ id, designId }) => ({ id, designId })));
  }
}
