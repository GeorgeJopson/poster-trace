import type { CampaignPosterLookup } from "@application/ports/CampaignPosterLookup";
import type { CampaignId } from "@domain/campaign/CampaignId";
import type { PosterId } from "@domain/poster/PosterId";

/** Returns the poster ids added for each campaign. */
export class InMemoryCampaignPosterLookup implements CampaignPosterLookup {
  private readonly posterIds = new Map<CampaignId, PosterId[]>();

  /** Adds `posterIds` to the campaign's posters. */
  add(campaignId: CampaignId, ...posterIds: PosterId[]): void {
    const existing = this.posterIds.get(campaignId) ?? [];
    this.posterIds.set(campaignId, [...existing, ...posterIds]);
  }

  async listPosterIds(campaignId: CampaignId): Promise<PosterId[]> {
    return this.posterIds.get(campaignId) ?? [];
  }
}
