import { describe, expect, it } from "vitest";

import { Campaign } from "@domain/campaign/Campaign";
import { CampaignTarget } from "@domain/campaign/CampaignTarget";
import { PosterDesign } from "@domain/campaign/design/PosterDesign";
import { PosterDesignId } from "@domain/campaign/design/PosterDesignId";
import { PosterDesignImage } from "@domain/campaign/design/PosterDesignImage";
import { QrPlacement } from "@domain/campaign/design/QrPlacement";
import { NotFoundError } from "@domain/shared/NotFoundError";
import { UserId } from "@domain/user/UserId";

import { A4_PDF_DETAILS } from "../support/pdfs";
import { InMemoryCampaignRepository } from "./fakes/InMemoryCampaignRepository";

// The fake must behave like the Drizzle repository, or use cases that store
// campaigns the wrong way would pass here and fail in production.

const ownerId = UserId.from("alice");
const target = CampaignTarget.create("https://example.com/");
const placement = QrPlacement.create({ x: 1, y: 2, size: 3, rotation: 4 });
const bob = UserId.from("bob");
const image = PosterDesignImage.create(
  new Blob(["image"], { type: "application/pdf" }),
  A4_PDF_DETAILS,
);

describe("InMemoryCampaignRepository.create", () => {
  it("stores a new campaign with its designs and their images", async () => {
    const repository = new InMemoryCampaignRepository();
    const campaign = Campaign.create(ownerId, "Name", target);
    const design = campaign.addDesign(placement, image);

    await repository.create(campaign);

    const loaded = await repository.findByIdForOwner(campaign.id, ownerId);
    expect(loaded?.getName()).toBe("Name");
    expect(loaded?.getDesigns().map((d) => d.id)).toEqual([design.id]);
    const stored = await repository.findDesignImageForOwner(design.id, ownerId);
    expect(await new Response(stored?.data).text()).toBe("image");
  });

  it("throws and writes nothing for a campaign that's already stored", async () => {
    const repository = new InMemoryCampaignRepository();
    const campaign = Campaign.create(ownerId, "Name", target);
    await repository.create(campaign);

    campaign.setName("Renamed");
    campaign.addDesign(placement, image);

    await expect(repository.create(campaign)).rejects.toThrow();
    const loaded = await repository.findByIdForOwner(campaign.id, ownerId);
    expect(loaded?.getName()).toBe("Name");
    expect(loaded?.getDesigns()).toEqual([]);
    expect(repository.images.size).toBe(0);
  });

  it("throws and writes nothing for an id stored under another owner", async () => {
    const repository = new InMemoryCampaignRepository();
    const campaign = Campaign.create(ownerId, "Name", target);
    await repository.create(campaign);
    const asBob = Campaign.restore({
      id: campaign.id,
      ownerId: bob,
      name: "Stolen",
      target,
      designs: [],
    });

    await expect(repository.create(asBob)).rejects.toThrow();
    const loaded = await repository.findByIdForOwner(campaign.id, ownerId);
    expect(loaded?.getName()).toBe("Name");
    expect(await repository.findAllByOwner(bob)).toEqual([]);
  });
});

describe("InMemoryCampaignRepository.update", () => {
  it("throws NotFoundError and writes nothing for a campaign that isn't stored", async () => {
    const repository = new InMemoryCampaignRepository();
    const campaign = Campaign.create(ownerId, "Name", target);
    campaign.addDesign(placement, image);

    await expect(repository.update(campaign)).rejects.toThrow(NotFoundError);
    expect(repository.campaigns).toEqual([]);
    expect(repository.images.size).toBe(0);
  });

  it("updates a stored campaign, its designs' placements, and adds new designs", async () => {
    const repository = new InMemoryCampaignRepository();
    const campaign = Campaign.create(ownerId, "Name", target);
    const first = campaign.addDesign(placement, image);
    await repository.create(campaign);

    const moved = QrPlacement.create({ x: 9, y: 9, size: 9, rotation: 9 });
    const loaded = Campaign.restore({
      id: campaign.id,
      ownerId,
      name: "Renamed",
      target,
      designs: [
        PosterDesign.restore({
          id: first.id,
          qrPlacement: moved,
          imageLoader: async () => null,
        }),
      ],
    });
    const second = loaded.addDesign(placement, image);
    await repository.update(loaded);

    const reloaded = await repository.findByIdForOwner(campaign.id, ownerId);
    expect(reloaded?.getName()).toBe("Renamed");
    expect(reloaded?.getDesigns().map((d) => d.id)).toEqual([
      first.id,
      second.id,
    ]);
    expect({ ...reloaded?.getDesigns()[0].qrPlacement }).toEqual({ ...moved });
    expect(repository.campaigns).toHaveLength(1);
    expect(repository.images.size).toBe(2);
  });

  it("doesn't store a new design's image again once it's stored", async () => {
    const repository = new InMemoryCampaignRepository();
    const campaign = Campaign.create(ownerId, "Name", target);
    campaign.addDesign(placement, image);

    await repository.create(campaign);
    await repository.update(campaign);

    expect(repository.images.size).toBe(1);
    const loaded = await repository.findByIdForOwner(campaign.id, ownerId);
    expect(loaded?.getDesigns()).toHaveLength(1);
  });

  it("keeps stored designs that are missing from a stale copy", async () => {
    const repository = new InMemoryCampaignRepository();
    const campaign = Campaign.create(ownerId, "Name", target);
    await repository.create(campaign);
    const stale = (await repository.findByIdForOwner(campaign.id, ownerId))!;

    const current = (await repository.findByIdForOwner(campaign.id, ownerId))!;
    const added = current.addDesign(placement, image);
    await repository.update(current);
    stale.setName("Renamed");
    await repository.update(stale);

    const loaded = await repository.findByIdForOwner(campaign.id, ownerId);
    expect(loaded?.getName()).toBe("Renamed");
    expect(loaded?.getDesigns().map((d) => d.id)).toEqual([added.id]);
  });

  it("throws NotFoundError and writes nothing for another owner's campaign", async () => {
    const repository = new InMemoryCampaignRepository();
    const campaign = Campaign.create(ownerId, "Name", target);
    await repository.create(campaign);

    const asBob = Campaign.restore({
      id: campaign.id,
      ownerId: bob,
      name: "Stolen",
      target,
      designs: [],
    });
    asBob.addDesign(placement, image);

    await expect(repository.update(asBob)).rejects.toThrow(NotFoundError);
    const loaded = await repository.findByIdForOwner(campaign.id, ownerId);
    expect(loaded?.getName()).toBe("Name");
    expect(loaded?.getDesigns()).toEqual([]);
    expect(repository.images.size).toBe(0);
  });

  it.each([
    [
      "another campaign's design",
      (bobsDesignId: PosterDesignId) => bobsDesignId,
    ],
    [
      "a design that isn't stored and has no image",
      () => PosterDesignId.generate(),
    ],
  ])("throws NotFoundError and writes nothing for %s", async (_, designId) => {
    const repository = new InMemoryCampaignRepository();
    const other = Campaign.create(bob, "Bob's", target);
    const bobsDesign = other.addDesign(placement, image);
    await repository.create(other);
    const campaign = Campaign.create(ownerId, "Name", target);
    await repository.create(campaign);

    const moved = QrPlacement.create({ x: 9, y: 9, size: 9, rotation: 9 });
    const attempt = Campaign.restore({
      id: campaign.id,
      ownerId,
      name: "Renamed",
      target,
      designs: [
        PosterDesign.restore({
          id: designId(bobsDesign.id),
          qrPlacement: moved,
          imageLoader: async () => null,
        }),
      ],
    });

    await expect(repository.update(attempt)).rejects.toThrow(NotFoundError);
    const loaded = await repository.findByIdForOwner(campaign.id, ownerId);
    expect(loaded?.getName()).toBe("Name");
    expect(loaded?.getDesigns()).toEqual([]);
    const [bobs] = (await repository.findAllByOwner(bob))[0].getDesigns();
    expect({ ...bobs.qrPlacement }).toEqual({ ...placement });
    expect(repository.images.size).toBe(1);
  });

  it("throws NotFoundError for another campaign's design that still holds its image", async () => {
    const repository = new InMemoryCampaignRepository();
    const other = Campaign.create(bob, "Bob's", target);
    const bobsDesign = other.addDesign(placement, image);
    await repository.create(other);
    const campaign = Campaign.create(ownerId, "Name", target);
    await repository.create(campaign);

    const attempt = Campaign.restore({
      id: campaign.id,
      ownerId,
      name: "Renamed",
      target,
      designs: [bobsDesign],
    });

    await expect(repository.update(attempt)).rejects.toThrow(NotFoundError);
    const loaded = await repository.findByIdForOwner(campaign.id, ownerId);
    expect(loaded?.getName()).toBe("Name");
    expect(loaded?.getDesigns()).toEqual([]);
    expect(repository.images.size).toBe(1);
  });

  it("adds a new design without loading or storing the stored ones' images", async () => {
    const repository = new InMemoryCampaignRepository();
    const campaign = Campaign.create(ownerId, "Name", target);
    const stored = campaign.addDesign(placement, image);
    await repository.create(campaign);

    let loads = 0;
    const loaded = Campaign.restore({
      id: campaign.id,
      ownerId,
      name: "Name",
      target,
      designs: [
        PosterDesign.restore({
          id: stored.id,
          qrPlacement: placement,
          imageLoader: async () => {
            loads++;
            return image;
          },
        }),
      ],
    });
    loaded.addDesign(placement, image);
    await repository.update(loaded);

    expect(loads).toBe(0);
    expect(repository.images.size).toBe(2);
  });
});

describe("InMemoryCampaignRepository design images", () => {
  it("loads a stored design's image", async () => {
    const repository = new InMemoryCampaignRepository();
    const campaign = Campaign.create(ownerId, "Name", target);
    campaign.addDesign(placement, image);
    await repository.create(campaign);

    const loaded = await repository.findByIdForOwner(campaign.id, ownerId);
    const [design] = loaded!.getDesigns();
    const stored = await design.image();
    expect(stored.contentType).toBe("application/pdf");
    expect(await stored.data.text()).toBe("image");
  });
});
