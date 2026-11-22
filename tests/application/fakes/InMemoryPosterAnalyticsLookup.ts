import type {
  PosterAnalyticsLookup,
  PosterSummary,
} from "@application/ports/PosterAnalyticsLookup";
import type { CampaignId } from "@domain/campaign/CampaignId";

/** Returns the summaries added for each campaign. */
export class InMemoryPosterAnalyticsLookup implements PosterAnalyticsLookup {
  private readonly summaries = new Map<CampaignId, PosterSummary[]>();

  /** Adds `summary` to the campaign's posters. */
  add(campaignId: CampaignId, summary: PosterSummary): void {
    const summaries = this.summaries.get(campaignId) ?? [];
    this.summaries.set(campaignId, [...summaries, summary]);
  }

  async summarisePosters(campaignId: CampaignId): Promise<PosterSummary[]> {
    return [...(this.summaries.get(campaignId) ?? [])];
  }
}
