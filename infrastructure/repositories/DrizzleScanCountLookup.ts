import { count, eq, inArray } from "drizzle-orm";

import type {
  PosterScanCount,
  ScanCountLookup,
} from "@application/ports/ScanCountLookup";
import { PosterDesignId } from "@domain/campaign/design/PosterDesignId";
import { PosterId } from "@domain/poster/PosterId";
import { PosterName } from "@domain/poster/PosterName";
import { RegistrationLocation } from "@domain/poster/RegistrationLocation";

import type { Db } from "../db/client";
import {
  poster as posterTable,
  registration as registrationTable,
  scan as scanTable,
} from "../db/schema";

export class DrizzleScanCountLookup implements ScanCountLookup {
  constructor(private readonly db: Db) {}

  async countScansPerPoster(
    designIds: readonly PosterDesignId[],
  ): Promise<PosterScanCount[]> {
    if (designIds.length === 0) return [];
    // Counted in one query, without loading any scans (see ADR-0015). The
    // left join keeps posters with no scans, and count(scan.id) gives them 0.
    // A poster has at most one registration, so joining it adds no rows, and
    // unregistered posters get a null poster name and location. A location's
    // columns are all set or all null.
    const rows = await this.db
      .select({
        posterId: posterTable.id,
        designId: posterTable.posterDesignId,
        posterName: registrationTable.posterName,
        latitude: registrationTable.latitude,
        longitude: registrationTable.longitude,
        accuracy: registrationTable.accuracy,
        scanCount: count(scanTable.id),
      })
      .from(posterTable)
      .leftJoin(scanTable, eq(scanTable.posterId, posterTable.id))
      .leftJoin(
        registrationTable,
        eq(registrationTable.posterId, posterTable.id),
      )
      .where(inArray(posterTable.posterDesignId, [...designIds]))
      .groupBy(posterTable.id, registrationTable.posterId);
    return rows.map((row) => ({
      posterId: PosterId.from(row.posterId),
      designId: PosterDesignId.from(row.designId),
      posterName:
        row.posterName === null ? null : PosterName.create(row.posterName),
      location:
        row.latitude === null || row.longitude === null || row.accuracy === null
          ? null
          : RegistrationLocation.create({
              latitude: row.latitude,
              longitude: row.longitude,
              accuracy: row.accuracy,
            }),
      scanCount: row.scanCount,
    }));
  }
}
