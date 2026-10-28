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
 * it's given, so a change only persists through the method that saves it.
 * `updateDetails` copies only the name and target, and `addDesign` rejects a
 * design that isn't in the campaign.
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

  async add(campaign: Campaign): Promise<void> {
    this.campaigns.push({
      id: campaign.id,
      ownerId: campaign.ownerId,
      name: campaign.getName(),
      target: campaign.getTarget(),
      designs: [],
    });
  }

  async updateDetails(campaign: Campaign): Promise<void> {
    const stored = this.findStored(campaign.id, campaign.ownerId);
    if (!stored) throw new NotFoundError("Campaign not found");
    stored.name = campaign.getName();
    stored.target = campaign.getTarget();
  }

  async addDesign(
    campaign: Campaign,
    design: PosterDesign,
    image: PosterDesignImageUpload,
  ): Promise<void> {
    if (!campaign.getDesigns().includes(design)) {
      throw new Error("The design isn't one of the campaign's designs");
    }
    const stored = this.findStored(campaign.id, campaign.ownerId);
    if (!stored) throw new NotFoundError("Campaign not found");

    const imageRef = PosterDesignImageRef.from(crypto.randomUUID());
    this.images.set(imageRef, {
      data: image.data,
      contentType: image.contentType,
    });
    stored.designs.push({
      id: design.id,
      qrPlacement: design.qrPlacement,
      imageRef,
    });
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
