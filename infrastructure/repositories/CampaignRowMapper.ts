import { Campaign } from "@domain/campaign/Campaign";
import { CampaignId } from "@domain/campaign/CampaignId";
import { CampaignTarget } from "@domain/campaign/CampaignTarget";
import { PosterDesign } from "@domain/campaign/design/PosterDesign";
import { PosterDesignId } from "@domain/campaign/design/PosterDesignId";
import { QrPlacement } from "@domain/campaign/design/QrPlacement";
import { UserId } from "@domain/user/UserId";

import type { campaign, posterDesign } from "../db/schema";

export type PosterDesignRow = Pick<
  typeof posterDesign.$inferSelect,
  "id" | "x" | "y" | "size" | "rotation"
>;

export type CampaignRowWithDesigns = Pick<
  typeof campaign.$inferSelect,
  "id" | "userId" | "name" | "target"
> & { posterDesigns: PosterDesignRow[] };

/**
 * Rebuilds entities from stored rows. Values go through the domain's
 * validating factories, so a stored value that breaks a rule fails here
 * rather than becoming an invalid entity.
 */
export class CampaignRowMapper {
  static toEntity(row: CampaignRowWithDesigns): Campaign {
    return Campaign.restore({
      id: CampaignId.from(row.id),
      ownerId: UserId.from(row.userId),
      name: row.name,
      target: CampaignTarget.create(row.target),
      designs: row.posterDesigns.map(CampaignRowMapper.designToEntity),
    });
  }

  static designToEntity(row: PosterDesignRow): PosterDesign {
    const { x, y, size, rotation } = row;
    return PosterDesign.restore({
      id: PosterDesignId.from(row.id),
      qrPlacement: QrPlacement.create({ x, y, size, rotation }),
    });
  }
}
