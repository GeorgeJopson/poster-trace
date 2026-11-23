import type { CampaignPosterLookup } from "@application/ports/CampaignPosterLookup";
import type { CampaignId } from "@domain/campaign/CampaignId";
import type { PosterId } from "@domain/poster/PosterId";

import type { InMemoryCampaignRepository } from "./InMemoryCampaignRepository";
import type { InMemoryPosterRepository } from "./InMemoryPosterRepository";

/**
 * Behaves like DrizzleCampaignPosterLookup, joining the stored posters to the
 * stored campaigns' designs.
 */
export class InMemoryCampaignPosterLookup implements CampaignPosterLookup {
  constructor(
    private readonly campaigns: InMemoryCampaignRepository,
    private readonly posters: InMemoryPosterRepository,
  ) {}

  async listPosterIds(campaignId: CampaignId): Promise<PosterId[]> {
    const campaign = this.campaigns.campaigns.find(
      ({ id }) => id === campaignId,
    );
    const designIds = new Set(campaign?.designs.map(({ id }) => id));
    return this.posters.posters
      .filter(({ designId }) => designIds.has(designId))
      .map(({ id }) => id);
  }
}
