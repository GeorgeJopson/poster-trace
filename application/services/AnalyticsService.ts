import "server-only";

import { CampaignId } from "@domain/campaign/CampaignId";
import type { CampaignRepository } from "@domain/campaign/CampaignRepository";
import { NotFoundError } from "@domain/shared/NotFoundError";

import { requireUserId } from "../auth/requireUserId";
import type { CampaignAnalyticsDto } from "../dto/AnalyticsDto";
import type { ScanCountLookup } from "../ports/ScanCountLookup";
import type { SessionProvider } from "../ports/SessionProvider";

/** Analytics of the signed-in user's campaigns. */
export class AnalyticsService {
  /** How many posters the analytics list as a campaign's top posters. */
  static readonly TOP_POSTER_COUNT = 5;

  constructor(
    private readonly sessions: SessionProvider,
    private readonly campaigns: CampaignRepository,
    private readonly scanCounts: ScanCountLookup,
  ) {}

  /**
   * What the analytics show for one of the signed-in user's campaigns: its
   * scan distribution and top posters, with each design referred to by its
   * position in the campaign. The campaign is loaded for its owner, which is
   * how ownership is checked (see ADR-0009), so another user's campaign
   * reads as missing (see ADR-0005).
   */
  async getCampaignAnalytics(
    campaignId: string,
  ): Promise<CampaignAnalyticsDto> {
    const userId = await requireUserId(this.sessions);
    const id = CampaignId.parse(campaignId);
    const campaign = id && (await this.campaigns.findByIdForOwner(id, userId));
    if (!campaign) throw new NotFoundError("Campaign not found");

    const designIds = campaign.getDesigns().map((design) => design.id);
    const counts = await this.scanCounts.countScansPerPoster(designIds);
    if (counts.length === 0) return { kind: "noPosters" };

    const positionOf = new Map(designIds.map((id, position) => [id, position]));
    const highestScanCount = Math.max(
      ...counts.map(({ scanCount }) => scanCount),
    );
    const scanDistribution = designIds.map((_, position) => ({
      position,
      posterCounts: new Array<number>(highestScanCount + 1).fill(0),
    }));
    for (const { designId, scanCount } of counts) {
      scanDistribution[positionOf.get(designId)!].posterCounts[scanCount]++;
    }

    const topPosters = counts
      .filter(({ scanCount }) => scanCount > 0)
      .sort(
        (a, b) =>
          b.scanCount - a.scanCount ||
          (a.posterId < b.posterId ? -1 : a.posterId > b.posterId ? 1 : 0),
      )
      .slice(0, AnalyticsService.TOP_POSTER_COUNT)
      .map(({ posterId, designId, scanCount }) => ({
        posterId,
        designPosition: positionOf.get(designId)!,
        scanCount,
      }));

    return { kind: "posters", scanDistribution, topPosters };
  }
}
