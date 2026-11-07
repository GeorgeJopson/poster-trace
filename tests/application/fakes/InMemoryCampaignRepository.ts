import { Campaign } from "@domain/campaign/Campaign";
import type { CampaignId } from "@domain/campaign/CampaignId";
import type { CampaignRepository } from "@domain/campaign/CampaignRepository";
import type { CampaignTarget } from "@domain/campaign/CampaignTarget";
import { PosterDesign } from "@domain/campaign/design/PosterDesign";
import type { PosterDesignId } from "@domain/campaign/design/PosterDesignId";
import type { PosterDesignImageContent } from "@domain/campaign/design/PosterDesignImageContent";
import { PosterDesignImage } from "@domain/campaign/design/PosterDesignImage";
import type { QrPlacement } from "@domain/campaign/design/QrPlacement";
import { NotFoundError } from "@domain/shared/NotFoundError";
import type { UserId } from "@domain/user/UserId";

type StoredDesign = {
  id: PosterDesignId;
  qrPlacement: QrPlacement;
  imageKey: string;
};

type StoredCampaign = {
  id: CampaignId;
  ownerId: UserId;
  name: string;
  target: CampaignTarget;
  designs: StoredDesign[];
};

type StoredImage = { data: Blob; contentType: string };

/**
 * Behaves like DrizzleCampaignRepository: it stores copies, not the entities
 * it's given, so a change only persists once the campaign is saved. `save`
 * writes all or nothing, keeps stored designs missing from the campaign, and
 * stores a design's `image` only when the design is new. Like the real one,
 * it never deletes images.
 */
export class InMemoryCampaignRepository implements CampaignRepository {
  // In insertion order, like ordering by created_at.
  readonly campaigns: StoredCampaign[] = [];
  readonly images = new Map<string, StoredImage>();

  async findAllByOwner(ownerId: UserId): Promise<Campaign[]> {
    return this.campaigns
      .filter((campaign) => campaign.ownerId === ownerId)
      .map((stored) => this.toEntity(stored));
  }

  async findByIdForOwner(
    id: CampaignId,
    ownerId: UserId,
  ): Promise<Campaign | null> {
    const stored = this.findStored(id, ownerId);
    return stored ? this.toEntity(stored) : null;
  }

  async save(campaign: Campaign): Promise<void> {
    const existing = this.campaigns.find((c) => c.id === campaign.id);
    if (existing && existing.ownerId !== campaign.ownerId) {
      throw new NotFoundError("Campaign not found");
    }
    const stored = existing ?? {
      id: campaign.id,
      ownerId: campaign.ownerId,
      name: campaign.getName(),
      target: campaign.getTarget(),
      designs: [],
    };
    // Checked before writing anything, so a failed save changes nothing.
    for (const design of campaign.getDesigns()) {
      const storedHere = stored.designs.some((d) => d.id === design.id);
      if (!storedHere && (this.isStored(design.id) || !design.image)) {
        throw new NotFoundError("Poster design not found");
      }
    }

    if (!existing) this.campaigns.push(stored);
    stored.name = campaign.getName();
    stored.target = campaign.getTarget();
    for (const design of campaign.getDesigns()) {
      const storedDesign = stored.designs.find((d) => d.id === design.id);
      if (storedDesign) {
        storedDesign.qrPlacement = design.qrPlacement;
      } else {
        stored.designs.push({
          id: design.id,
          qrPlacement: design.qrPlacement,
          imageKey: this.storeImage(design.image!),
        });
      }
    }
  }

  async findDesignImageForOwner(
    designId: PosterDesignId,
    ownerId: UserId,
  ): Promise<PosterDesignImageContent | null> {
    const design = this.campaigns
      .filter((campaign) => campaign.ownerId === ownerId)
      .flatMap((campaign) => campaign.designs)
      .find((design) => design.id === designId);
    const image = design && this.images.get(design.imageKey);
    if (!image) return null;
    return { data: image.data.stream(), contentType: image.contentType };
  }

  /** What deleting a user cascades to in the database. */
  deleteAllByOwner(ownerId: UserId) {
    const kept = this.campaigns.filter(
      (campaign) => campaign.ownerId !== ownerId,
    );
    this.campaigns.splice(0, this.campaigns.length, ...kept);
  }

  private isStored(designId: PosterDesignId) {
    return this.campaigns.some((campaign) =>
      campaign.designs.some((design) => design.id === designId),
    );
  }

  private storeImage(image: PosterDesignImage) {
    const key = crypto.randomUUID();
    this.images.set(key, { data: image.data, contentType: image.contentType });
    return key;
  }

  private findStored(id: CampaignId, ownerId: UserId) {
    return this.campaigns.find(
      (campaign) => campaign.id === id && campaign.ownerId === ownerId,
    );
  }

  private toEntity(stored: StoredCampaign): Campaign {
    return Campaign.restore({
      id: stored.id,
      ownerId: stored.ownerId,
      name: stored.name,
      target: stored.target,
      designs: stored.designs.map(({ id, qrPlacement, imageKey }) =>
        PosterDesign.restore({
          id,
          qrPlacement,
          loadImage: async () => {
            const image = this.images.get(imageKey);
            return image
              ? PosterDesignImage.restore(image.data, image.contentType)
              : null;
          },
        }),
      ),
    });
  }
}
