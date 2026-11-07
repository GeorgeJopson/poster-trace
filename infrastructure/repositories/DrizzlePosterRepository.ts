import { eq } from "drizzle-orm";

import { PosterDesignId } from "@domain/campaign/design/PosterDesignId";
import { Poster } from "@domain/poster/Poster";
import { PosterId } from "@domain/poster/PosterId";
import type { PosterRepository } from "@domain/poster/PosterRepository";

import type { Db } from "../db/client";
import { poster as posterTable, scan as scanTable } from "../db/schema";

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

  async findById(id: PosterId): Promise<Poster | null> {
    // A poster's stored scans are never loaded (see ADR-0015).
    const [row] = await this.db
      .select({ id: posterTable.id, designId: posterTable.posterDesignId })
      .from(posterTable)
      .where(eq(posterTable.id, id))
      .limit(1);
    return row
      ? Poster.restore({
          id: PosterId.from(row.id),
          designId: PosterDesignId.from(row.designId),
        })
      : null;
  }

  async addNewScans(poster: Poster): Promise<void> {
    if (poster.newScans.length === 0) return;
    // One INSERT, so it's all or nothing.
    await this.db.insert(scanTable).values(
      poster.newScans.map((scan) => ({
        id: scan.id,
        posterId: poster.id,
        scannedAt: scan.scannedAt,
      })),
    );
  }
}
