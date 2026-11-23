import "server-only";

import { ClientScanUrlService } from "@clientApplication/services/ClientScanUrlService";
import { CampaignId } from "@domain/campaign/CampaignId";
import type { CampaignRepository } from "@domain/campaign/CampaignRepository";
import { PosterDesignId } from "@domain/campaign/design/PosterDesignId";
import { Poster } from "@domain/poster/Poster";
import type { PosterRepository } from "@domain/poster/PosterRepository";
import { NotFoundError } from "@domain/shared/NotFoundError";

import { requireUserId } from "../auth/requireUserId";
import type { PosterDto } from "../dto/PosterDto";
import type { ScanTargetCopy } from "../ports/ScanTargetCopy";
import type { SessionProvider } from "../ports/SessionProvider";

/** The posters of the signed-in user's poster designs. */
export class PosterService {
  constructor(
    private readonly sessions: SessionProvider,
    private readonly campaigns: CampaignRepository,
    private readonly posters: PosterRepository,
    private readonly scanTargets: ScanTargetCopy,
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
    if (!campaign || !design) {
      throw new NotFoundError("Poster design not found");
    }

    const posters = Poster.generate(design.id, count);
    await this.posters.save(posters);
    // For the scan redirect, which reads the copy first (ADR-0020). The
    // posters are saved, so the copy is only a shortcut: if it fails, the
    // redirect falls back to the database and copies the target itself, so
    // the posters are still returned.
    try {
      await this.scanTargets.copy(
        posters.map((poster) => poster.id),
        campaign.getTarget(),
      );
    } catch (error) {
      console.error("Couldn't copy the new posters' target", error);
    }
    return posters.map((poster) => ({
      id: poster.id,
      scanUrl: ClientScanUrlService.build(this.baseUrl, poster.id),
    }));
  }

  /**
   * A scan URL for no real poster, for previews to encode. It's built like
   * every poster's, so a preview's QR code matches the printed ones.
   */
  sampleScanUrl(): string {
    return ClientScanUrlService.buildSample(this.baseUrl);
  }
}
