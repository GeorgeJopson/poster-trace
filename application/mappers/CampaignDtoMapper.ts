import type { Campaign } from "@domain/campaign/Campaign";
import type { PosterDesign } from "@domain/campaign/design/PosterDesign";

import type { CampaignDto } from "../dto/CampaignDto";
import type { PosterDesignDto } from "../dto/PosterDesignDto";

export class CampaignDtoMapper {
  static toDto(campaign: Campaign): CampaignDto {
    return {
      id: campaign.id,
      name: campaign.getName(),
      target: campaign.getTarget().value,
      posterDesigns: campaign.getDesigns().map(CampaignDtoMapper.designToDto),
    };
  }

  static designToDto(design: PosterDesign): PosterDesignDto {
    const { x, y, size, rotation } = design.qrPlacement;
    return { id: design.id, qrPlacement: { x, y, size, rotation } };
  }
}
