import type { UserId } from "../user/UserId";
import type { Campaign } from "./Campaign";
import type { CampaignId } from "./CampaignId";
import type { PosterDesign } from "./design/PosterDesign";
import type { PosterDesignId } from "./design/PosterDesignId";
import type { PosterDesignImageContent } from "./design/PosterDesignImageContent";
import type { PosterDesignImageRef } from "./design/PosterDesignImageRef";
import type { PosterDesignImageUpload } from "./design/PosterDesignImageUpload";

/**
 * Stores campaigns with their designs. Reads for an owner take their id, and
 * treat other users' campaigns as missing. Writes use the `ownerId` of the
 * campaign passed in.
 *
 * Designs are only ever written by design-specific methods (`addDesign`):
 * every new change to the aggregate needs its own method here.
 */
export interface CampaignRepository {
  /** The owner's campaigns with their designs, oldest first. */
  findAllByOwner(ownerId: UserId): Promise<Campaign[]>;

  /** The campaign with its designs, or `null` if it's missing or not owned. */
  findByIdForOwner(id: CampaignId, ownerId: UserId): Promise<Campaign | null>;

  /** Stores a campaign made by `Campaign.create`. */
  add(campaign: Campaign): Promise<void>;

  /**
   * Saves the campaign's name and target, never its designs. Throws
   * `NotFoundError` if the campaign isn't owned by its `ownerId`.
   */
  updateDetails(campaign: Campaign): Promise<void>;

  /**
   * Stores a design returned by `campaign.addDesign`, with its image. Throws if
   * `design` isn't one of the campaign's designs, and `NotFoundError` if the
   * campaign isn't owned by its `ownerId`.
   */
  addDesign(
    campaign: Campaign,
    design: PosterDesign,
    image: PosterDesignImageUpload,
  ): Promise<void>;

  /** The design's image, or `null` if it's missing or not owned. */
  findDesignImageForOwner(
    designId: PosterDesignId,
    ownerId: UserId,
  ): Promise<PosterDesignImageContent | null>;

  /** Every design image of the owner's campaigns, for account deletion. */
  findAllDesignImageRefsByOwner(
    ownerId: UserId,
  ): Promise<PosterDesignImageRef[]>;

  /** Deletes stored design images, for account deletion. */
  deleteDesignImages(refs: PosterDesignImageRef[]): Promise<void>;
}
