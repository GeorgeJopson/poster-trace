import "server-only";

import { CampaignId } from "@domain/campaign/CampaignId";
import type { CampaignRepository } from "@domain/campaign/CampaignRepository";
import { PosterDesignId } from "@domain/campaign/design/PosterDesignId";
import { Poster } from "@domain/poster/Poster";
import type { PosterRepository } from "@domain/poster/PosterRepository";
import { NotFoundError } from "@domain/shared/NotFoundError";

import { requireUserId } from "../auth/requireUserId";
import type { PosterDto } from "../dto/PosterDto";
import type { SessionProvider } from "../ports/SessionProvider";

/** The posters of the signed-in user's poster designs. */
export class PosterService {
  constructor(
    private readonly sessions: SessionProvider,
    private readonly campaigns: CampaignRepository,
    private readonly posters: PosterRepository,
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
      scanUrl: new URL(`/redirect/${poster.id}`, this.baseUrl).href,
    }));
  }
}
