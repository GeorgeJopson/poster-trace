import type { ScanTargetLookup } from "@application/ports/ScanTargetLookup";
import type { CampaignTarget } from "@domain/campaign/CampaignTarget";
import type { PosterId } from "@domain/poster/PosterId";

/** Behaves like DrizzleScanTargetLookup, over posters added to it. */
export class InMemoryScanTargetLookup implements ScanTargetLookup {
  private readonly targets = new Map<PosterId, CampaignTarget>();

  addPoster(posterId: PosterId, target: CampaignTarget) {
    this.targets.set(posterId, target);
  }

  async findTarget(posterId: PosterId): Promise<CampaignTarget | null> {
    return this.targets.get(posterId) ?? null;
  }
}
