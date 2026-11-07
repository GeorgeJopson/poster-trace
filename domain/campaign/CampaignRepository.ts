import type { UserId } from "../user/UserId";
import type { Campaign } from "./Campaign";
import type { CampaignId } from "./CampaignId";
import type { PosterDesignId } from "./design/PosterDesignId";
import type { PosterDesignImageContent } from "./design/PosterDesignImageContent";

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
   * updates its name and target. Designs that aren't stored yet are stored
   * with their `image`; stored designs get their QR placement updated, and
   * keep their image, which never changes. A stored design that's missing
   * from the campaign is kept, never deleted. Throws `NotFoundError` if the
   * campaign or one of its designs is stored under someone else, or a design
   * that isn't stored has no `image` in memory.
   */
  save(campaign: Campaign): Promise<void>;

  /**
   * The design's image as a stream, for serving it, or `null` if it's
   * missing or not owned. To use an image's bytes, load the campaign and
   * call the design's `loadImage()` instead.
   */
  findDesignImageForOwner(
    designId: PosterDesignId,
    ownerId: UserId,
  ): Promise<PosterDesignImageContent | null>;
}
