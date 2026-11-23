import type { CampaignTarget } from "@domain/campaign/CampaignTarget";
import type { PosterId } from "@domain/poster/PosterId";

/**
 * A copy of each poster's target, kept outside the database so that a scan
 * needn't wait for the database to wake up (ADR-0020). The scan redirect
 * (netlify/functions/redirect.mts) reads it, and falls back to the database
 * for a poster that isn't there. The database stays the source of truth, so
 * the copy is only written when a poster's target could change: when posters
 * are generated and when a campaign's target changes.
 */
export interface ScanTargetCopy {
  /** Sets the copied target of each poster to `target`. */
  copy(posterIds: readonly PosterId[], target: CampaignTarget): Promise<void>;
}
