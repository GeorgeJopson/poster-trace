import "server-only";

import { CampaignId } from "@domain/campaign/CampaignId";
import type { CampaignRepository } from "@domain/campaign/CampaignRepository";
import { NotFoundError } from "@domain/shared/NotFoundError";

import { requireUserId } from "../auth/requireUserId";
import type { CampaignAnalyticsDto } from "../dto/AnalyticsDto";
import type { PosterAnalyticsLookup } from "../ports/PosterAnalyticsLookup";
import type { SessionProvider } from "../ports/SessionProvider";

/** Analytics of the signed-in user's campaigns. */
export class AnalyticsService {
  /** How many posters the analytics list as a campaign's top posters. */
  static readonly TOP_POSTER_COUNT = 5;

  constructor(
    private readonly sessions: SessionProvider,
    private readonly campaigns: CampaignRepository,
    private readonly posterAnalytics: PosterAnalyticsLookup,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /**
   * What the analytics show for one of the signed-in user's campaigns: its
   * scans over time, with each design referred to by its position in the
   * campaign, its top posters, with their poster names, and its scan map of
   * located posters. The campaign is
   * loaded for its owner, which is how ownership is checked (see ADR-0009),
   * so another user's campaign reads as missing (see ADR-0005).
   */
  async getCampaignAnalytics(
    campaignId: string,
  ): Promise<CampaignAnalyticsDto> {
    const userId = await requireUserId(this.sessions);
    const id = CampaignId.parse(campaignId);
    const campaign = id && (await this.campaigns.findByIdForOwner(id, userId));
    if (!campaign) throw new NotFoundError("Campaign not found");

    const designIds = campaign.getDesigns().map((design) => design.id);
    const positionOf = new Map(designIds.map((id, position) => [id, position]));
    // The campaign and its posters are read separately, so a design added in
    // between could have posters the loaded campaign doesn't know. They're
    // left out until the next load rather than breaking the page.
    const summaries = (
      await this.posterAnalytics.summarisePosters(campaign.id)
    ).filter(({ designId }) => positionOf.has(designId));
    if (summaries.length === 0) return { kind: "noPosters" };

    const topPosters = summaries
      .filter(({ scanCount }) => scanCount > 0)
      .sort(
        (a, b) =>
          b.scanCount - a.scanCount ||
          (a.posterId < b.posterId ? -1 : a.posterId > b.posterId ? 1 : 0),
      )
      .slice(0, AnalyticsService.TOP_POSTER_COUNT)
      .map(({ posterId, posterName, scanCount }) => ({
        posterId,
        posterName: posterName?.value ?? null,
        scanCount,
      }));

    const mapPosters = summaries.flatMap(({ posterId, location, scanCount }) =>
      location
        ? [
            {
              posterId,
              latitude: location.latitude,
              longitude: location.longitude,
              scanCount,
            },
          ]
        : [],
    );
    const scanMap = {
      posters: mapPosters,
      maxScanCount: Math.max(
        0,
        ...mapPosters.map(({ scanCount }) => scanCount),
      ),
      unmappedPosterCount: summaries.length - mapPosters.length,
      posterCount: summaries.length,
    };

    // The campaign was loaded for its owner just now, so it only reads as
    // missing here if it has since been deleted.
    const campaignDailyScans = await this.posterAnalytics.countDailyScans(
      campaign.id,
    );
    if (!campaignDailyScans) throw new NotFoundError("Campaign not found");
    const days = daysFrom(
      dayOf(campaignDailyScans.createdAt),
      dayOf(this.now()),
    );
    const indexOfDay = new Map(days.map((day, index) => [day, index]));
    const dailyScansByDesign = new Map(
      designIds.map((_, position) => [
        position,
        new Array<number>(days.length).fill(0),
      ]),
    );
    for (const { designId, day, scanCount } of campaignDailyScans.dailyScans) {
      const position = positionOf.get(designId);
      // A day after today, from a clock running ahead, is left out.
      const index = indexOfDay.get(day);
      if (position === undefined || index === undefined) continue;
      dailyScansByDesign.get(position)![index] += scanCount;
    }
    const scansOverTime = { days, dailyScansByDesign };

    return { kind: "posters", scansOverTime, topPosters, scanMap };
  }
}

/** The UTC day `time` falls on, as `YYYY-MM-DD` (see ADR-0021). */
function dayOf(time: Date): string {
  return time.toISOString().slice(0, 10);
}

/** Every day from `first` to `last`, both `YYYY-MM-DD`, in order. */
function daysFrom(first: string, last: string): string[] {
  const days = [first];
  const day = new Date(`${first}T00:00:00Z`);
  while (days.at(-1)! < last) {
    day.setUTCDate(day.getUTCDate() + 1);
    days.push(dayOf(day));
  }
  return days;
}
