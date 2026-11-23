import type { CampaignId } from "@domain/campaign/CampaignId";
import type { PosterId } from "@domain/poster/PosterId";

/** Finds a campaign's posters, which are their own aggregate (ADR-0018). */
export interface CampaignPosterLookup {
  /**
   * The ids of every poster of every design of the campaign, in no
   * particular order. Empty for a campaign that doesn't exist. Doesn't check
   * who owns the campaign: callers must check that first.
   */
  listPosterIds(campaignId: CampaignId): Promise<PosterId[]>;
}
