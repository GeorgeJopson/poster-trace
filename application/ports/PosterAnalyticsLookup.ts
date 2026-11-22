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
}
