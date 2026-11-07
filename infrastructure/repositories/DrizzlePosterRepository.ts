import type { Poster } from "@domain/poster/Poster";
import type { PosterRepository } from "@domain/poster/PosterRepository";

import type { Db } from "../db/client";
import { poster as posterTable } from "../db/schema";

export class DrizzlePosterRepository implements PosterRepository {
  constructor(private readonly db: Db) {}

  async addAll(posters: readonly Poster[]): Promise<void> {
    if (posters.length === 0) return;
    // One INSERT, so it's all or nothing.
    await this.db.insert(posterTable).values(
      posters.map((poster) => ({
        id: poster.id,
        posterDesignId: poster.designId,
      })),
    );
  }
}
