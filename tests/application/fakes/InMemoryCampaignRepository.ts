import { Campaign } from "@domain/campaign/Campaign";
import type { CampaignId } from "@domain/campaign/CampaignId";
import type { CampaignRepository } from "@domain/campaign/CampaignRepository";
import type { CampaignTarget } from "@domain/campaign/CampaignTarget";
import { PosterDesign } from "@domain/campaign/design/PosterDesign";
import type { PosterDesignId } from "@domain/campaign/design/PosterDesignId";
import type { PosterDesignImageContent } from "@domain/campaign/design/PosterDesignImageContent";
import { PosterDesignImageRef } from "@domain/campaign/design/PosterDesignImageRef";
import type { PosterDesignImageUpload } from "@domain/campaign/design/PosterDesignImageUpload";
import type { QrPlacement } from "@domain/campaign/design/QrPlacement";
import { NotFoundError } from "@domain/shared/NotFoundError";
import type { UserId } from "@domain/user/UserId";

type StoredDesign = {
  id: PosterDesignId;
  qrPlacement: QrPlacement;
  imageRef: PosterDesignImageRef;
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
 * stores a design's `newImage` only when the design is new.
 */
export class InMemoryCampaignRepository implements CampaignRepository {
  // In insertion order, like ordering by created_at.
  readonly campaigns: StoredCampaign[] = [];
  readonly images = new Map<PosterDesignImageRef, StoredImage>();
  readonly deletedImageRefs: PosterDesignImageRef[] = [];

  async findAllByOwner(ownerId: UserId): Promise<Campaign[]> {
    return this.campaigns
      .filter((campaign) => campaign.ownerId === ownerId)
      .map(toEntity);
  }

  async findByIdForOwner(
    id: CampaignId,
    ownerId: UserId,
  ): Promise<Campaign | null> {
    const stored = this.findStored(id, ownerId);
    return stored ? toEntity(stored) : null;
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
      if (!storedHere && (this.isStored(design.id) || !design.newImage)) {
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
          imageRef: this.storeImage(design.newImage!),
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
    const image = design && this.images.get(design.imageRef);
    if (!image) return null;
    return { data: image.data.stream(), contentType: image.contentType };
  }

  async findAllDesignImageRefsByOwner(
    ownerId: UserId,
  ): Promise<PosterDesignImageRef[]> {
    return this.campaigns
      .filter((campaign) => campaign.ownerId === ownerId)
      .flatMap((campaign) => campaign.designs.map((design) => design.imageRef));
  }

  async deleteDesignImages(refs: PosterDesignImageRef[]): Promise<void> {
    for (const ref of refs) {
      this.images.delete(ref);
      this.deletedImageRefs.push(ref);
    }
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

  private storeImage(image: PosterDesignImageUpload) {
    const ref = PosterDesignImageRef.from(crypto.randomUUID());
    this.images.set(ref, { data: image.data, contentType: image.contentType });
    return ref;
  }

  private findStored(id: CampaignId, ownerId: UserId) {
    return this.campaigns.find(
      (campaign) => campaign.id === id && campaign.ownerId === ownerId,
    );
  }
}

function toEntity(stored: StoredCampaign): Campaign {
  return Campaign.restore({
    id: stored.id,
    ownerId: stored.ownerId,
    name: stored.name,
    target: stored.target,
    designs: stored.designs.map(({ id, qrPlacement }) =>
      PosterDesign.restore({ id, qrPlacement }),
    ),
  });
}
