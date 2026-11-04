import "server-only";

import { CampaignId } from "@domain/campaign/CampaignId";
import type { CampaignRepository } from "@domain/campaign/CampaignRepository";
import { PosterDesignId } from "@domain/campaign/design/PosterDesignId";
import { PosterDesignImageRules } from "@domain/campaign/design/PosterDesignImageRules";
import { PosterDesignImageUpload } from "@domain/campaign/design/PosterDesignImageUpload";
import { QrPlacement } from "@domain/campaign/design/QrPlacement";
import { NotFoundError } from "@domain/shared/NotFoundError";
import { ValidationError } from "@domain/shared/ValidationError";

import { requireUserId } from "../auth/requireUserId";
import type { CreatePosterDesignInput } from "../dto/inputs";
import type { PosterDesignImageDto } from "../dto/PosterDesignImageDto";
import type { SessionProvider } from "../ports/SessionProvider";
import { readPdfPageCount } from "../validation/readPdfPageCount";

/** The poster designs of the signed-in user's campaigns. */
export class PosterDesignService {
  constructor(
    private readonly sessions: SessionProvider,
    private readonly campaigns: CampaignRepository,
  ) {}

  async createPosterDesign(
    campaignId: string,
    input: CreatePosterDesignInput,
  ): Promise<void> {
    const userId = await requireUserId(this.sessions);
    // Validated before anything is stored.
    const qrPlacement = QrPlacement.create(input.qrPlacement);
    const image = PosterDesignImageUpload.create(
      input.image,
      input.image.type,
      await this.readPageCount(input.image),
    );

    const id = CampaignId.parse(campaignId);
    const campaign = id && (await this.campaigns.findByIdForOwner(id, userId));
    if (!campaign) {
      throw new NotFoundError("Campaign not found");
    }
    const design = campaign.addDesign(qrPlacement);
    await this.campaigns.addDesign(campaign, design, image);
  }

  /**
   * A PDF's page count, which the domain checks; `undefined` for images. A
   * file over the size limit isn't parsed, as the domain rejects it anyway.
   */
  private async readPageCount(image: Blob): Promise<number | undefined> {
    if (
      image.type !== PosterDesignImageRules.PDF_TYPE ||
      image.size > PosterDesignImageRules.MAX_SIZE_BYTES
    ) {
      return undefined;
    }
    const pageCount = await readPdfPageCount(image);
    if (pageCount === null) {
      throw new ValidationError("This PDF can't be read.");
    }
    return pageCount;
  }

  /** `null` if the design doesn't exist or isn't the user's. */
  async getMyPosterDesignImage(
    designId: string,
  ): Promise<PosterDesignImageDto | null> {
    const userId = await requireUserId(this.sessions);
    const id = PosterDesignId.parse(designId);
    if (!id) return null;
    return this.campaigns.findDesignImageForOwner(id, userId);
  }
}
