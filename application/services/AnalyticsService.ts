import "server-only";

import { CampaignId } from "@domain/campaign/CampaignId";
import type { CampaignRepository } from "@domain/campaign/CampaignRepository";
import { NotFoundError } from "@domain/shared/NotFoundError";
import { ValidationError } from "@domain/shared/ValidationError";
import type { UserId } from "@domain/user/UserId";

import { requireUserId } from "../auth/requireUserId";
import type { ScanDistributionRowDto, TopPosterDto } from "../dto/AnalyticsDto";
import type { ScanCountLookup } from "../ports/ScanCountLookup";
import type { SessionProvider } from "../ports/SessionProvider";

/** Analytics of the signed-in user's campaigns. */
export class AnalyticsService {
  constructor(
    private readonly sessions: SessionProvider,
    private readonly campaigns: CampaignRepository,
    private readonly scanCounts: ScanCountLookup,
  ) {}

  /**
   * How many of each design's posters have each scan count, for every count
   * from 0 to the highest, fewest scans first.
   */
  async getScanDistribution(
    campaignId: string,
  ): Promise<ScanDistributionRowDto[]> {
    const userId = await requireUserId(this.sessions);
    const { designIds, counts } = await this.countScans(campaignId, userId);
    const highest = Math.max(-1, ...counts.map(({ scans }) => scans));

    const rows = Array.from({ length: highest + 1 }, (_, scans) => ({
      scans,
      posters: Object.fromEntries(designIds.map((designId) => [designId, 0])),
    }));
    for (const { designId, scans } of counts) rows[scans].posters[designId]++;
    return rows;
  }

  /**
   * Up to `num` of the campaign's posters with the most scans, most first.
   * Posters with no scans are left out, and posters with the same scan count
   * are ordered by id, so the order is stable.
   */
  async getTopPosters(
    campaignId: string,
    num: number,
  ): Promise<TopPosterDto[]> {
    const userId = await requireUserId(this.sessions);
    if (!Number.isInteger(num) || num < 1) {
      throw new ValidationError(
        "The number of posters must be a whole number of at least 1.",
      );
    }
    const { counts } = await this.countScans(campaignId, userId);
    return counts
      .filter(({ scans }) => scans > 0)
      .sort(
        (a, b) =>
          b.scans - a.scans ||
          (a.posterId < b.posterId ? -1 : a.posterId > b.posterId ? 1 : 0),
      )
      .slice(0, num)
      .map(({ posterId, designId, scans }) => ({ posterId, designId, scans }));
  }

  /**
   * The ids of the user's campaign's designs, in campaign order,
   * and the scan count of each of their posters. The campaign is loaded for
   * its owner, which is how ownership is checked (see ADR-0009).
   */
  private async countScans(campaignId: string, userId: UserId) {
    const id = CampaignId.parse(campaignId);
    const campaign = id && (await this.campaigns.findByIdForOwner(id, userId));
    if (!campaign) throw new NotFoundError("Campaign not found");

    const designIds = campaign.getDesigns().map((design) => design.id);
    const counts = await this.scanCounts.countScansPerPoster(designIds);
    return { designIds, counts };
  }
}
