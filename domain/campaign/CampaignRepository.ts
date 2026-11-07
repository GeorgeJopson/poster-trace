import type { UserId } from "../user/UserId";
import type { Campaign } from "./Campaign";
import type { CampaignId } from "./CampaignId";
import type { PosterDesignId } from "./design/PosterDesignId";
import type { PosterDesignImageContent } from "./design/PosterDesignImageContent";
import type { PosterDesignImageRef } from "./design/PosterDesignImageRef";

/**
 * Stores campaigns with their designs. Reads for an owner take their id, and
 * treat other users' campaigns as missing. Writes use the `ownerId` of the
 * campaign passed in.
 */
export interface CampaignRepository {
  /** The owner's campaigns with their designs, oldest first. */
  findAllByOwner(ownerId: UserId): Promise<Campaign[]>;

  /** The campaign with its designs, or `null` if it's missing or not owned. */
  findByIdForOwner(id: CampaignId, ownerId: UserId): Promise<Campaign | null>;

  /**
   * Stores the whole campaign, all or nothing: inserts it if it's new, or
   * updates its name and target. New designs are stored with their
   * `newImage`; stored designs get their QR placement updated, and keep
   * their image. A stored design that's missing from the campaign is kept,
   * never deleted. Throws `NotFoundError` if the campaign or one of its
   * designs is stored under someone else, or a design without a `newImage`
   * isn't stored.
   */
  save(campaign: Campaign): Promise<void>;

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
