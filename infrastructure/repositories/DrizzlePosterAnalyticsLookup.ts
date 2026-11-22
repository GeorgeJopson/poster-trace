import { count, eq } from "drizzle-orm";

import type {
  PosterAnalyticsLookup,
  PosterSummary,
} from "@application/ports/PosterAnalyticsLookup";
import type { CampaignId } from "@domain/campaign/CampaignId";
import { PosterDesignId } from "@domain/campaign/design/PosterDesignId";
import { PosterId } from "@domain/poster/PosterId";
import { PosterName } from "@domain/poster/PosterName";
import { RegistrationLocation } from "@domain/poster/RegistrationLocation";

import type { Db } from "../db/client";
import {
  poster as posterTable,
  posterDesign as posterDesignTable,
  registration as registrationTable,
  scan as scanTable,
} from "../db/schema";

export class DrizzlePosterAnalyticsLookup implements PosterAnalyticsLookup {
  constructor(private readonly db: Db) {}

  async summarisePosters(campaignId: CampaignId): Promise<PosterSummary[]> {
    // Counted in one query, without loading any scans (see ADR-0015). The
    // inner join to the design picks the campaign's posters. The left join to
    // scans keeps posters with no scans, and count(scan.id) gives them 0. A
    // poster has at most one registration, so joining it adds no rows, and
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
      .innerJoin(
        posterDesignTable,
        eq(posterDesignTable.id, posterTable.posterDesignId),
      )
      .leftJoin(scanTable, eq(scanTable.posterId, posterTable.id))
      .leftJoin(
        registrationTable,
        eq(registrationTable.posterId, posterTable.id),
      )
      .where(eq(posterDesignTable.campaignId, campaignId))
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
