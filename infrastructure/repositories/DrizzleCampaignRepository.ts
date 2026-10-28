import { and, eq } from "drizzle-orm";

import type { Campaign } from "@domain/campaign/Campaign";
import type { CampaignId } from "@domain/campaign/CampaignId";
import type { CampaignRepository } from "@domain/campaign/CampaignRepository";
import type { PosterDesign } from "@domain/campaign/design/PosterDesign";
import type { PosterDesignId } from "@domain/campaign/design/PosterDesignId";
import type { PosterDesignImageContent } from "@domain/campaign/design/PosterDesignImageContent";
import { PosterDesignImageRef } from "@domain/campaign/design/PosterDesignImageRef";
import type { PosterDesignImageUpload } from "@domain/campaign/design/PosterDesignImageUpload";
import { NotFoundError } from "@domain/shared/NotFoundError";
import type { UserId } from "@domain/user/UserId";

import type { Db } from "../db/client";
import { campaign as campaignTable, posterDesign } from "../db/schema";
import type { BlobStore } from "../storage/BlobStore";
import { CampaignRowMapper } from "./CampaignRowMapper";

// Every query is scoped to an owner: designs and images through their
// campaign. A campaign owned by someone else is treated exactly like one that
// doesn't exist.

// Designs are loaded without their image key, which only this class uses.
const designsInOrder = {
  columns: { id: true, x: true, y: true, size: true, rotation: true },
  orderBy: { createdAt: "asc", id: "asc" },
} as const;

export class DrizzleCampaignRepository implements CampaignRepository {
  constructor(
    private readonly db: Db,
    private readonly blobStore: BlobStore,
  ) {}

  async findAllByOwner(ownerId: UserId): Promise<Campaign[]> {
    const rows = await this.db.query.campaign.findMany({
      where: { userId: ownerId },
      orderBy: { createdAt: "asc", id: "asc" },
      with: { posterDesigns: designsInOrder },
    });
    return rows.map(CampaignRowMapper.toEntity);
  }

  async findByIdForOwner(
    id: CampaignId,
    ownerId: UserId,
  ): Promise<Campaign | null> {
    const row = await this.db.query.campaign.findFirst({
      where: { id, userId: ownerId },
      with: { posterDesigns: designsInOrder },
    });
    return row ? CampaignRowMapper.toEntity(row) : null;
  }

  async add(campaign: Campaign): Promise<void> {
    await this.db.insert(campaignTable).values({
      id: campaign.id,
      userId: campaign.ownerId,
      name: campaign.getName(),
      target: campaign.getTarget().value,
    });
  }

  async updateDetails(campaign: Campaign): Promise<void> {
    const updated = await this.db
      .update(campaignTable)
      .set({ name: campaign.getName(), target: campaign.getTarget().value })
      .where(this.isOwned(campaign))
      .returning({ id: campaignTable.id });
    if (updated.length === 0) {
      throw new NotFoundError("Campaign not found");
    }
  }

  async addDesign(
    campaign: Campaign,
    design: PosterDesign,
    image: PosterDesignImageUpload,
  ): Promise<void> {
    if (!campaign.getDesigns().includes(design)) {
      throw new Error("The design isn't one of the campaign's designs");
    }
    const [owned] = await this.db
      .select({ id: campaignTable.id })
      .from(campaignTable)
      .where(this.isOwned(campaign));
    if (!owned) {
      throw new NotFoundError("Campaign not found");
    }

    // The blob's own key, not the design id.
    const designImageKey = crypto.randomUUID();
    await this.blobStore.set(designImageKey, image.data, image.contentType);
    try {
      const { x, y, size, rotation } = design.qrPlacement;
      await this.db.insert(posterDesign).values({
        id: design.id,
        campaignId: campaign.id,
        designImageKey,
        x,
        y,
        size,
        rotation,
      });
    } catch (error) {
      // Don't leave an image behind that no design points to.
      await this.blobStore.delete(designImageKey);
      throw error;
    }
  }

  async findDesignImageForOwner(
    designId: PosterDesignId,
    ownerId: UserId,
  ): Promise<PosterDesignImageContent | null> {
    const [design] = await this.db
      .select({ designImageKey: posterDesign.designImageKey })
      .from(posterDesign)
      .innerJoin(campaignTable, eq(posterDesign.campaignId, campaignTable.id))
      .where(
        and(eq(posterDesign.id, designId), eq(campaignTable.userId, ownerId)),
      );
    if (!design) return null;

    const blob = await this.blobStore.getStream(design.designImageKey);
    return blob && { data: blob.data, contentType: blob.contentType };
  }

  async findAllDesignImageRefsByOwner(
    ownerId: UserId,
  ): Promise<PosterDesignImageRef[]> {
    const designs = await this.db
      .select({ designImageKey: posterDesign.designImageKey })
      .from(posterDesign)
      .innerJoin(campaignTable, eq(posterDesign.campaignId, campaignTable.id))
      .where(eq(campaignTable.userId, ownerId));
    return designs.map(({ designImageKey }) =>
      PosterDesignImageRef.from(designImageKey),
    );
  }

  async deleteDesignImages(refs: PosterDesignImageRef[]): Promise<void> {
    await Promise.all(refs.map((ref) => this.blobStore.delete(ref)));
  }

  private isOwned(campaign: Campaign) {
    return and(
      eq(campaignTable.id, campaign.id),
      eq(campaignTable.userId, campaign.ownerId),
    );
  }
}
