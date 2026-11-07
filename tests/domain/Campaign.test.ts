import { describe, expect, it } from "vitest";

import { Campaign } from "@domain/campaign/Campaign";
import { CampaignId } from "@domain/campaign/CampaignId";
import { CampaignTarget } from "@domain/campaign/CampaignTarget";
import { PosterDesign } from "@domain/campaign/design/PosterDesign";
import { PosterDesignId } from "@domain/campaign/design/PosterDesignId";
import { PosterDesignImage } from "@domain/campaign/design/PosterDesignImage";
import { QrPlacement } from "@domain/campaign/design/QrPlacement";
import { UserId } from "@domain/user/UserId";

import { A4_PDF_DETAILS } from "../support/pdfs";

const ownerId = UserId.from("owner");
const target = CampaignTarget.create("https://example.com/");
const placement = QrPlacement.create({ x: 1, y: 2, size: 3, rotation: 4 });
const image = PosterDesignImage.create(
  new Blob(["pdf"], { type: "application/pdf" }),
  A4_PDF_DETAILS,
);

describe("Campaign", () => {
  it("creates a campaign with a generated id and no designs", () => {
    const campaign = Campaign.create(ownerId, "Name", target);
    expect(CampaignId.parse(campaign.id)).toBe(campaign.id);
    expect(campaign.ownerId).toBe(ownerId);
    expect(campaign.getName()).toBe("Name");
    expect(campaign.getTarget()).toBe(target);
    expect(campaign.getDesigns()).toEqual([]);
  });

  it("generates a fresh id for each campaign", () => {
    const a = Campaign.create(ownerId, "A", target);
    const b = Campaign.create(ownerId, "B", target);
    expect(a.id).not.toBe(b.id);
  });

  it("restores a stored campaign without generating anything", () => {
    const id = CampaignId.generate();
    const design = PosterDesign.restore({
      id: PosterDesignId.generate(),
      qrPlacement: placement,
      loadImage: async () => image,
    });
    const campaign = Campaign.restore({
      id,
      ownerId,
      name: "Stored",
      target,
      designs: [design],
    });
    expect(campaign.id).toBe(id);
    expect(campaign.getName()).toBe("Stored");
    expect(campaign.getDesigns()).toEqual([design]);
    expect(design.image).toBeUndefined();
  });

  it("updates its name", () => {
    const campaign = Campaign.create(ownerId, "Old", target);
    campaign.setName("New");
    expect(campaign.getName()).toBe("New");
    expect(campaign.getTarget()).toBe(target);
  });

  it("updates its target", () => {
    const campaign = Campaign.create(ownerId, "Name", target);
    const newTarget = CampaignTarget.create("https://example.com/new");
    campaign.setTarget(newTarget);
    expect(campaign.getTarget()).toBe(newTarget);
    expect(campaign.getName()).toBe("Name");
  });

  it("adds designs with fresh ids, in order", () => {
    const campaign = Campaign.create(ownerId, "Name", target);
    const first = campaign.addDesign(placement, image);
    const second = campaign.addDesign(placement, image);

    expect(PosterDesignId.parse(first.id)).toBe(first.id);
    expect(first.id).not.toBe(second.id);
    expect(first.qrPlacement).toBe(placement);
    expect(first.image).toBe(image);
    expect(campaign.getDesigns()).toEqual([first, second]);
  });

  it("doesn't share the designs array it was restored from", () => {
    const designs: PosterDesign[] = [];
    const campaign = Campaign.restore({
      id: CampaignId.generate(),
      ownerId,
      name: "Name",
      target,
      designs,
    });
    campaign.addDesign(placement, image);
    expect(designs).toEqual([]);
  });
});

describe("PosterDesign", () => {
  it("creates a design with a generated id", () => {
    const design = PosterDesign.create(placement, image);
    expect(PosterDesignId.parse(design.id)).toBe(design.id);
    expect(design.qrPlacement).toBe(placement);
    expect(PosterDesign.create(placement, image).id).not.toBe(design.id);
  });

  it("finds one of its designs by id", () => {
    const campaign = Campaign.create(ownerId, "Name", target);
    campaign.addDesign(placement, image);
    const second = campaign.addDesign(placement, image);
    expect(campaign.findDesign(second.id)).toBe(second);
    expect(campaign.findDesign(PosterDesignId.generate())).toBeUndefined();
  });
});
