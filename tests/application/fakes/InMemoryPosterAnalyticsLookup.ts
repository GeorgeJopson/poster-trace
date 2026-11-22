import type {
  CampaignDailyScans,
  DailyScanCount,
  PosterAnalyticsLookup,
  PosterSummary,
} from "@application/ports/PosterAnalyticsLookup";
import type { CampaignId } from "@domain/campaign/CampaignId";

/**
 * Returns the summaries and daily scan counts added for each campaign. A
 * campaign exists once it's given a creation time.
 */
export class InMemoryPosterAnalyticsLookup implements PosterAnalyticsLookup {
  private readonly summaries = new Map<CampaignId, PosterSummary[]>();
  private readonly dailyScans = new Map<CampaignId, CampaignDailyScans>();

  /** Adds `summary` to the campaign's posters. */
  add(campaignId: CampaignId, summary: PosterSummary): void {
    const summaries = this.summaries.get(campaignId) ?? [];
    this.summaries.set(campaignId, [...summaries, summary]);
  }

  /** Records that the campaign was created at `createdAt`. */
  setCreatedAt(campaignId: CampaignId, createdAt: Date): void {
    const dailyScans = this.dailyScans.get(campaignId)?.dailyScans ?? [];
    this.dailyScans.set(campaignId, { createdAt, dailyScans });
  }

  /** Adds `count` to the campaign's daily scans. Set its creation time first. */
  addDailyScans(campaignId: CampaignId, count: DailyScanCount): void {
    const { createdAt, dailyScans } = this.dailyScans.get(campaignId)!;
    this.dailyScans.set(campaignId, {
      createdAt,
      dailyScans: [...dailyScans, count],
    });
  }

  async summarisePosters(campaignId: CampaignId): Promise<PosterSummary[]> {
    return this.summaries.get(campaignId) ?? [];
  }

  async countDailyScans(
    campaignId: CampaignId,
  ): Promise<CampaignDailyScans | null> {
    return this.dailyScans.get(campaignId) ?? null;
  }
}
