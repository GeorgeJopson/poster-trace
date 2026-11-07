import type { CampaignTarget } from "@domain/campaign/CampaignTarget";
import type { PosterId } from "@domain/poster/PosterId";

/**
 * Finds where a scan of a poster sends the scanner. A read-only query across
 * the Poster and Campaign aggregates, so a scan doesn't load the campaign
 * and its designs (see ADR-0014).
 */
export interface ScanTargetLookup {
  /** The target of the poster's campaign, or `null` if there's no such poster. */
  findTarget(posterId: PosterId): Promise<CampaignTarget | null>;
}
