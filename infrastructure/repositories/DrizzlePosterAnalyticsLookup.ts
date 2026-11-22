import { count, eq, sql } from "drizzle-orm";

import {
  type CampaignScanSlots,
  type PosterAnalyticsLookup,
  type PosterSummary,
  SCAN_SLOT_MS,
} from "@application/ports/PosterAnalyticsLookup";
import type { CampaignId } from "@domain/campaign/CampaignId";
import { PosterDesignId } from "@domain/campaign/design/PosterDesignId";
import { PosterId } from "@domain/poster/PosterId";
import { PosterName } from "@domain/poster/PosterName";
import { RegistrationLocation } from "@domain/poster/RegistrationLocation";

import type { Db } from "../db/client";
import {
  campaign as campaignTable,
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

  async countScanSlots(
    campaignId: CampaignId,
  ): Promise<CampaignScanSlots | null> {
    const [campaign] = await this.db
      .select({ createdAt: campaignTable.createdAt })
      .from(campaignTable)
      .where(eq(campaignTable.id, campaignId));
    if (!campaign) return null;

    // Counted in the database without loading any scans (see ADR-0015).
    // Times are stored in UTC, so a scan's slot is its number of whole slots
    // since the Unix epoch. The slot length is inlined rather than a
    // parameter, so the select and group by are the same expression.
    const slot = sql<number>`floor(extract(epoch from ${scanTable.scannedAt}) / ${sql.raw(String(SCAN_SLOT_MS / 1000))})::integer`;
    const rows = await this.db
      .select({
        designId: posterTable.posterDesignId,
        slot,
        scanCount: count(),
      })
      .from(scanTable)
      .innerJoin(posterTable, eq(posterTable.id, scanTable.posterId))
      .innerJoin(
        posterDesignTable,
        eq(posterDesignTable.id, posterTable.posterDesignId),
      )
      .where(eq(posterDesignTable.campaignId, campaignId))
      .groupBy(posterTable.posterDesignId, slot);
    return {
      createdAt: campaign.createdAt,
      slots: rows.map((row) => ({
        designId: PosterDesignId.from(row.designId),
        slotStart: new Date(row.slot * SCAN_SLOT_MS),
        scanCount: row.scanCount,
      })),
    };
  }
}
