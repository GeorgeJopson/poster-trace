import type { CampaignTarget } from "@domain/campaign/CampaignTarget";
import type { PosterId } from "@domain/poster/PosterId";

/**
 * Prototype: a copy of each poster's target, kept outside the database so a
 * scan can be redirected without waiting for the database to wake up. The
 * scan redirect (netlify/edge-functions/redirect.ts) reads it, falling back
 * to the database if a poster isn't there. The database stays the source of
 * truth, so the copy only has to be written when a poster's target could
 * change: when posters are generated and when a campaign's target changes.
 */
export interface ScanTargetCopy {
  /** Sets the copied target of each poster to `target`. */
  copy(posterIds: readonly PosterId[], target: CampaignTarget): Promise<void>;
}
