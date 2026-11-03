import { describe, expect, it } from "vitest";

import { Campaign } from "@domain/campaign/Campaign";
import { CampaignId } from "@domain/campaign/CampaignId";
import { CampaignTarget } from "@domain/campaign/CampaignTarget";
import { PosterDesign } from "@domain/campaign/design/PosterDesign";
import { PosterDesignId } from "@domain/campaign/design/PosterDesignId";
import { QrPlacement } from "@domain/campaign/design/QrPlacement";
import { UserId } from "@domain/user/UserId";

const ownerId = UserId.from("owner");
const target = CampaignTarget.create("https://example.com/");
const placement = QrPlacement.create({ x: 1, y: 2, size: 3, rotation: 4 });

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
  });

  it("updates its name and target", () => {
    const campaign = Campaign.create(ownerId, "Old", target);
    const newTarget = CampaignTarget.create("https://example.com/new");
    campaign.updateDetails("New", newTarget);
    expect(campaign.getName()).toBe("New");
    expect(campaign.getTarget()).toBe(newTarget);
  });

  it("adds designs with fresh ids, in order", () => {
    const campaign = Campaign.create(ownerId, "Name", target);
    const first = campaign.addDesign(placement);
    const second = campaign.addDesign(placement);

    expect(PosterDesignId.parse(first.id)).toBe(first.id);
    expect(first.id).not.toBe(second.id);
    expect(first.qrPlacement).toBe(placement);
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
    campaign.addDesign(placement);
    expect(designs).toEqual([]);
  });
});

describe("PosterDesign", () => {
  it("creates a design with a generated id", () => {
    const design = PosterDesign.create(placement);
    expect(PosterDesignId.parse(design.id)).toBe(design.id);
    expect(design.qrPlacement).toBe(placement);
    expect(PosterDesign.create(placement).id).not.toBe(design.id);
  });
});
