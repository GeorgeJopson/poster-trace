import { and, eq, sql } from "drizzle-orm";

import type { Campaign } from "@domain/campaign/Campaign";
import type { CampaignId } from "@domain/campaign/CampaignId";
import type { CampaignRepository } from "@domain/campaign/CampaignRepository";
import type { PosterDesignId } from "@domain/campaign/design/PosterDesignId";
import { PosterDesignImage } from "@domain/campaign/design/PosterDesignImage";
import type { PosterDesignImageContent } from "@domain/campaign/design/PosterDesignImageContent";
import { NotFoundError } from "@domain/shared/NotFoundError";
import type { UserId } from "@domain/user/UserId";

import type { Db } from "../db/client";
import { campaign as campaignTable, posterDesign } from "../db/schema";
import type { BlobStore } from "../storage/BlobStore";
import { CampaignRowMapper } from "./CampaignRowMapper";

// Every query is scoped to an owner: designs and images through their
// campaign. A campaign owned by someone else is treated exactly like one that
// doesn't exist.

// Images are written and never deleted here: a blob nothing points to, such
// as one from a save that failed, is deleted by the daily clean-up job
// (ADR-0013).

// What a transaction shares with the database, as the two drivers' own
// transaction types differ.
type Transaction = Pick<Db, "insert" | "update">;

// A design's image key only reaches the domain inside its image loader.
const designsInOrder = {
  columns: {
    id: true,
    designImageKey: true,
    x: true,
    y: true,
    size: true,
    rotation: true,
  },
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
    return rows.map((row) => CampaignRowMapper.toEntity(row, this.imageLoader));
  }

  async findByIdForOwner(
    id: CampaignId,
    ownerId: UserId,
  ): Promise<Campaign | null> {
    const row = await this.db.query.campaign.findFirst({
      where: { id, userId: ownerId },
      with: { posterDesigns: designsInOrder },
    });
    return row ? CampaignRowMapper.toEntity(row, this.imageLoader) : null;
  }

  async save(campaign: Campaign): Promise<void> {
    await this.db.transaction((tx) => this.writeCampaign(tx, campaign));
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

  /**
   * Upserts the campaign and its designs. Each design that's inserted has
   * its image uploaded under a new key before the transaction commits, as
   * the blob store can't join it.
   */
  private async writeCampaign(
    tx: Transaction,
    campaign: Campaign,
  ): Promise<void> {
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

    for (const design of campaign.getDesigns()) {
      const { x, y, size, rotation } = design.qrPlacement;
      // Each image gets its own key, not the design id.
      const key = crypto.randomUUID();
      const [inserted] = await tx
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
      if (inserted) {
        // A design that isn't stored must bring its image. Throwing rolls
        // back the insert.
        const image = design.image;
        if (!image) throw new NotFoundError("Poster design not found");
        await this.blobStore.set(key, image.data, image.contentType);
        continue;
      }
      // Already stored, so it keeps its image and only its placement is
      // updated: only this campaign's designs, and never their image key.
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
  }

  /** Loads the image under `key`, for a restored design. */
  private readonly imageLoader = (key: string) => async () => {
    const blob = await this.blobStore.getStream(key);
    if (!blob) return null;
    const data = await new Response(blob.data).blob();
    return PosterDesignImage.restore(data, blob.contentType);
  };
}
