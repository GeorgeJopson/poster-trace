import "server-only";

import { CampaignId } from "@domain/campaign/CampaignId";
import type { CampaignRepository } from "@domain/campaign/CampaignRepository";
import { PosterDesignId } from "@domain/campaign/design/PosterDesignId";
import { Poster } from "@domain/poster/Poster";
import type { PosterRepository } from "@domain/poster/PosterRepository";
import { NotFoundError } from "@domain/shared/NotFoundError";

import { requireUserId } from "../auth/requireUserId";
import type { CampaignScanCountsDto } from "../dto/CampaignScanCountsDto";
import type { PosterDto } from "../dto/PosterDto";
import type { PosterScanCounts } from "../ports/PosterScanCounts";
import type { SessionProvider } from "../ports/SessionProvider";

/** Stands in for a poster's id in previews: a UUID, like every real one. */
const SAMPLE_POSTER_ID = "00000000-0000-0000-0000-000000000000";

/** The URL a poster's QR code encodes, which can never change (ADR-0014). */
function buildScanUrl(baseUrl: string, posterId: string): string {
  return new URL(`/redirect/${posterId}`, baseUrl).href;
}

function sumScans(items: readonly { scanCount: number }[]): number {
  return items.reduce((total, { scanCount }) => total + scanCount, 0);
}

/** The posters of the signed-in user's poster designs. */
export class PosterService {
  constructor(
    private readonly sessions: SessionProvider,
    private readonly campaigns: CampaignRepository,
    private readonly posters: PosterRepository,
    private readonly scanCounts: PosterScanCounts,
    /** Where Poster Trace is served from, which QR codes point back to. */
    private readonly baseUrl: string,
  ) {}

  /**
   * Generates `count` posters of the campaign's design. The design is found
   * through its campaign, which is how ownership is checked (see ADR-0009).
   */
  async generatePosters(
    campaignId: string,
    designId: string,
    count: number,
  ): Promise<PosterDto[]> {
    const userId = await requireUserId(this.sessions);

    const id = CampaignId.parse(campaignId);
    const campaign = id && (await this.campaigns.findByIdForOwner(id, userId));
    const parsedDesignId = PosterDesignId.parse(designId);
    const design = parsedDesignId && campaign?.findDesign(parsedDesignId);
    if (!design) {
      throw new NotFoundError("Poster design not found");
    }

    const posters = Poster.generate(design.id, count);
    await this.posters.addAll(posters);
    return posters.map((poster) => ({
      id: poster.id,
      scanUrl: buildScanUrl(this.baseUrl, poster.id),
    }));
  }

  /**
   * How many scans each poster of the campaign has had, grouped by design.
   * `null` if the campaign doesn't exist or isn't the user's.
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

  /**
   * A scan URL for no real poster, for previews to encode. It's built like
   * every poster's, so a preview's QR code matches the printed ones.
   */
  sampleScanUrl(): string {
    return buildScanUrl(this.baseUrl, SAMPLE_POSTER_ID);
  }
}
