import { and, eq, sql } from "drizzle-orm";

import type { Campaign } from "@domain/campaign/Campaign";
import type { CampaignId } from "@domain/campaign/CampaignId";
import type { CampaignRepository } from "@domain/campaign/CampaignRepository";
import type { PosterDesignId } from "@domain/campaign/design/PosterDesignId";
import type { PosterDesignImageContent } from "@domain/campaign/design/PosterDesignImageContent";
import { PosterDesignImageRef } from "@domain/campaign/design/PosterDesignImageRef";
import { NotFoundError } from "@domain/shared/NotFoundError";
import type { UserId } from "@domain/user/UserId";

import type { Db } from "../db/client";
import { campaign as campaignTable, posterDesign } from "../db/schema";
import type { BlobStore } from "../storage/BlobStore";
import { CampaignRowMapper } from "./CampaignRowMapper";

// Every query is scoped to an owner: designs and images through their
// campaign. A campaign owned by someone else is treated exactly like one that
// doesn't exist.

// What a transaction shares with the database, as the two drivers' own
// transaction types differ.
type Transaction = Pick<Db, "insert" | "update">;

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

  async save(campaign: Campaign): Promise<void> {
    // Images go to the blob store first, as it can't join the transaction.
    // Each gets its own key, not the design id.
    const newImageKeys = new Map<PosterDesignId, string>();
    let unusedKeys: string[];
    try {
      for (const design of campaign.getDesigns()) {
        if (!design.newImage) continue;
        const key = crypto.randomUUID();
        newImageKeys.set(design.id, key);
        const { data, contentType } = design.newImage;
        await this.blobStore.set(key, data, contentType);
      }
      unusedKeys = await this.db.transaction((tx) =>
        this.writeCampaign(tx, campaign, newImageKeys),
      );
    } catch (error) {
      // Don't leave images behind that no design points to.
      await this.deleteUnusedBlobs([...newImageKeys.values()]);
      throw error;
    }
    await this.deleteUnusedBlobs(unusedKeys);
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

  /**
   * Upserts the campaign and its designs. Returns the keys of new images
   * whose design turned out to be stored already, so nothing uses them.
   */
  private async writeCampaign(
    tx: Transaction,
    campaign: Campaign,
    newImageKeys: ReadonlyMap<PosterDesignId, string>,
  ): Promise<string[]> {
    const details = {
      name: campaign.getName(),
      target: campaign.getTarget().value,
    };
    // An id stored under another owner isn't updated, and returns no row.
    // (After onConflict*, this Drizzle version only types `returning()`.)
    const [owned] = await tx
      .insert(campaignTable)
      .values({ id: campaign.id, userId: campaign.ownerId, ...details })
      .onConflictDoUpdate({
        target: campaignTable.id,
        set: details,
        setWhere: eq(campaignTable.userId, campaign.ownerId),
      })
      .returning();
    if (!owned) {
      throw new NotFoundError("Campaign not found");
    }

    const unusedKeys: string[] = [];
    for (const design of campaign.getDesigns()) {
      const { x, y, size, rotation } = design.qrPlacement;
      const key = newImageKeys.get(design.id);
      if (key) {
        const inserted = await tx
          .insert(posterDesign)
          .values({
            id: design.id,
            campaignId: campaign.id,
            designImageKey: key,
            x,
            y,
            size,
            rotation,
            // now() is fixed for the whole transaction, which would lose the
            // order of designs added in one save.
            createdAt: sql`clock_timestamp()`,
          })
          .onConflictDoNothing({ target: posterDesign.id })
          .returning();
        if (inserted.length > 0) continue;
        // Already stored, so it keeps its image and only its placement is
        // updated below.
        unusedKeys.push(key);
      }
      // Only this campaign's designs, and never their image key.
      const updated = await tx
        .update(posterDesign)
        .set({ x, y, size, rotation })
        .where(
          and(
            eq(posterDesign.id, design.id),
            eq(posterDesign.campaignId, campaign.id),
          ),
        )
        .returning({ id: posterDesign.id });
      if (updated.length === 0) {
        throw new NotFoundError("Poster design not found");
      }
    }
    return unusedKeys;
  }

  /**
   * Best effort: an image nothing points to is harmless (see ADR-0008), so a
   * failed delete mustn't hide the save's own error, or fail a save that
   * committed.
   */
  private async deleteUnusedBlobs(keys: string[]) {
    await Promise.allSettled(keys.map((key) => this.blobStore.delete(key)));
  }
}
