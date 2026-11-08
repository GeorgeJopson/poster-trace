import { count, eq, inArray } from "drizzle-orm";

import type {
  PosterScanCount,
  PosterScanCounts,
} from "@application/ports/PosterScanCounts";
import { PosterDesignId } from "@domain/campaign/design/PosterDesignId";
import { PosterId } from "@domain/poster/PosterId";

import type { Db } from "../db/client";
import { poster as posterTable, scan as scanTable } from "../db/schema";

export class DrizzlePosterScanCounts implements PosterScanCounts {
  constructor(private readonly db: Db) {}

  async countForDesigns(
    designIds: readonly PosterDesignId[],
  ): Promise<PosterScanCount[]> {
    if (designIds.length === 0) return [];
    // Counted in one grouped query, so scans are never loaded. The left join
    // keeps posters with no scans, and count(scan.id) gives them 0.
    const rows = await this.db
      .select({
        posterId: posterTable.id,
        designId: posterTable.posterDesignId,
        scanCount: count(scanTable.id),
      })
      .from(posterTable)
      .leftJoin(scanTable, eq(scanTable.posterId, posterTable.id))
      .where(inArray(posterTable.posterDesignId, [...designIds]))
      .groupBy(posterTable.id);
    return rows.map((row) => ({
      posterId: PosterId.from(row.posterId),
      designId: PosterDesignId.from(row.designId),
      scanCount: row.scanCount,
    }));
  }
}
