import "server-only";

import { CampaignId } from "@domain/campaign/CampaignId";
import type { CampaignRepository } from "@domain/campaign/CampaignRepository";

import { requireUserId } from "../auth/requireUserId";
import type { CampaignScanCountsDto } from "../dto/CampaignScanCountsDto";
import type { PosterScanCounts } from "../ports/PosterScanCounts";
import type { SessionProvider } from "../ports/SessionProvider";

function sumScans(items: readonly { scanCount: number }[]): number {
  return items.reduce((total, { scanCount }) => total + scanCount, 0);
}

/**
 * How the signed-in user's campaigns are doing. Only a campaign's owner can
 * see its analytics, unlike ScanService, which anyone scanning a poster uses.
 */
export class CampaignAnalyticsService {
  constructor(
    private readonly sessions: SessionProvider,
    private readonly campaigns: CampaignRepository,
    private readonly scanCounts: PosterScanCounts,
  ) {}

  /**
   * How many scans each poster of the campaign has had, grouped by design.
   * `null` if the campaign doesn't exist or isn't the user's. The designs are
   * found through the campaign, which is how ownership is checked (see
   * ADR-0009).
   */
  async getMyCampaignScanCounts(
    campaignId: string,
  ): Promise<CampaignScanCountsDto | null> {
    const userId = await requireUserId(this.sessions);
    const id = CampaignId.parse(campaignId);
    const campaign = id && (await this.campaigns.findByIdForOwner(id, userId));
    if (!campaign) return null;

    const designIds = campaign.getDesigns().map((design) => design.id);
    const counts = await this.scanCounts.countForDesigns(designIds);
    const posterDesigns = designIds.map((designId) => {
      const posters = counts
        .filter((count) => count.designId === designId)
        .map(({ posterId, scanCount }) => ({ id: posterId, scanCount }))
        // Ties go by id, which is arbitrary but keeps the order stable.
        .sort(
          (a, b) =>
            b.scanCount - a.scanCount ||
            (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
        );
      return { id: designId, scanCount: sumScans(posters), posters };
    });
    return { scanCount: sumScans(posterDesigns), posterDesigns };
  }
}
