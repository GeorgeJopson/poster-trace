import { describe, expect, it } from "vitest";

import { Campaign } from "@domain/campaign/Campaign";
import { CampaignTarget } from "@domain/campaign/CampaignTarget";
import { PosterDesign } from "@domain/campaign/design/PosterDesign";
import { PosterDesignImageUpload } from "@domain/campaign/design/PosterDesignImageUpload";
import { QrPlacement } from "@domain/campaign/design/QrPlacement";
import { NotFoundError } from "@domain/shared/NotFoundError";
import { UserId } from "@domain/user/UserId";

import { InMemoryCampaignRepository } from "./fakes/InMemoryCampaignRepository";

// The fake must behave like the Drizzle repository, or use cases that save
// the wrong way would pass here and fail in production.

const ownerId = UserId.from("alice");
const target = CampaignTarget.create("https://example.com/");
const placement = QrPlacement.create({ x: 1, y: 2, size: 3, rotation: 4 });
const upload = PosterDesignImageUpload.create(
  new Blob(["image"], { type: "image/png" }),
  "image/png",
);

async function storedCampaign(repository: InMemoryCampaignRepository) {
  const campaign = Campaign.create(ownerId, "Name", target);
  await repository.add(campaign);
  return campaign;
}

describe("InMemoryCampaignRepository", () => {
  it("doesn't save designs through updateDetails", async () => {
    const repository = new InMemoryCampaignRepository();
    const campaign = await storedCampaign(repository);

    campaign.addDesign(placement);
    campaign.updateDetails("Renamed", target);
    await repository.updateDetails(campaign);

    const loaded = await repository.findByIdForOwner(campaign.id, ownerId);
    expect(loaded?.getName()).toBe("Renamed");
    expect(loaded?.getDesigns()).toEqual([]);
  });

  it("rejects a design that isn't in the campaign", async () => {
    const repository = new InMemoryCampaignRepository();
    const campaign = await storedCampaign(repository);

    await expect(
      repository.addDesign(campaign, PosterDesign.create(placement), upload),
    ).rejects.toThrow("isn't one of the campaign's designs");
    expect(repository.images.size).toBe(0);
  });

  it("scopes writes to the campaign's owner", async () => {
    const repository = new InMemoryCampaignRepository();
    const unsaved = Campaign.create(ownerId, "Unsaved", target);

    await expect(repository.updateDetails(unsaved)).rejects.toThrow(
      NotFoundError,
    );
    const design = unsaved.addDesign(placement);
    await expect(repository.addDesign(unsaved, design, upload)).rejects.toThrow(
      NotFoundError,
    );
  });
});
