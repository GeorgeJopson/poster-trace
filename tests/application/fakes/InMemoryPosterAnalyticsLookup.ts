import type {
  CampaignScanSlots,
  PosterAnalyticsLookup,
  PosterSummary,
  ScanSlot,
} from "@application/ports/PosterAnalyticsLookup";
import type { CampaignId } from "@domain/campaign/CampaignId";

/**
 * Returns the summaries and scan slots added for each campaign. A campaign
 * exists once it's given a creation time.
 */
export class InMemoryPosterAnalyticsLookup implements PosterAnalyticsLookup {
  private readonly summaries = new Map<CampaignId, PosterSummary[]>();
  private readonly scanSlots = new Map<CampaignId, CampaignScanSlots>();

  /** Adds `summary` to the campaign's posters. */
  add(campaignId: CampaignId, summary: PosterSummary): void {
    const summaries = this.summaries.get(campaignId) ?? [];
    this.summaries.set(campaignId, [...summaries, summary]);
  }

  /** Records that the campaign was created at `createdAt`. */
  setCreatedAt(campaignId: CampaignId, createdAt: Date): void {
    const slots = this.scanSlots.get(campaignId)?.slots ?? [];
    this.scanSlots.set(campaignId, { createdAt, slots });
  }

  /** Adds `slot` to the campaign's scan slots. Set its creation time first. */
  addScanSlot(campaignId: CampaignId, slot: ScanSlot): void {
    const { createdAt, slots } = this.scanSlots.get(campaignId)!;
    this.scanSlots.set(campaignId, { createdAt, slots: [...slots, slot] });
  }

  async summarisePosters(campaignId: CampaignId): Promise<PosterSummary[]> {
    return this.summaries.get(campaignId) ?? [];
  }

  async countScanSlots(
    campaignId: CampaignId,
  ): Promise<CampaignScanSlots | null> {
    return this.scanSlots.get(campaignId) ?? null;
  }
}
