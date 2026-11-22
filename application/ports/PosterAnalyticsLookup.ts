import type { CampaignId } from "@domain/campaign/CampaignId";
import type { PosterDesignId } from "@domain/campaign/design/PosterDesignId";
import type { PosterId } from "@domain/poster/PosterId";
import type { PosterName } from "@domain/poster/PosterName";
import type { RegistrationLocation } from "@domain/poster/RegistrationLocation";

/**
 * What the analytics need to know about one poster: its design, its poster
 * name if it's registered, its location if it's located, and its scan count.
 */
export type PosterSummary = {
  posterId: PosterId;
  designId: PosterDesignId;
  /** `null` if the poster isn't registered. */
  posterName: PosterName | null;
  /** `null` if the poster isn't located. */
  location: RegistrationLocation | null;
  scanCount: number;
};

/** How long each scan slot lasts: 15 minutes, in milliseconds. */
export const SCAN_SLOT_MS = 15 * 60 * 1000;

/**
 * How many scans of one design's posters happened in one scan slot. Slots
 * are 15 minutes long and start on the quarter hour in UTC. Every time zone's
 * offset is a whole number of quarter hours, so each slot falls within one
 * day wherever it's viewed.
 */
export type ScanSlot = {
  designId: PosterDesignId;
  /** When the slot starts. */
  slotStart: Date;
  /** At least 1. */
  scanCount: number;
};

/** When a campaign was created, and its scans counted by scan slot. */
export type CampaignScanSlots = {
  createdAt: Date;
  /** Only slots with scans, in no particular order. */
  slots: ScanSlot[];
};

/**
 * Reads what a campaign's analytics show about its posters. A read-only
 * query, so stored scans are counted in the database rather than loaded
 * (see ADR-0015, ADR-0017).
 */
export interface PosterAnalyticsLookup {
  /**
   * A summary of every poster of the campaign, including unregistered posters
   * and posters with no scans, in no particular order. Empty for a campaign
   * that doesn't exist. Doesn't check who owns the campaign: callers must
   * check that first.
   */
  summarisePosters(campaignId: CampaignId): Promise<PosterSummary[]>;

  /**
   * When the campaign was created, and its posters' scans counted by design
   * and scan slot. `null` for a campaign that doesn't exist. Doesn't check
   * who owns the campaign: callers must check that first.
   */
  countScanSlots(campaignId: CampaignId): Promise<CampaignScanSlots | null>;
}
