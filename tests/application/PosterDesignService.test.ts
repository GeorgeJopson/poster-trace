import { beforeEach, describe, expect, it } from "vitest";

import { NotAuthenticatedError } from "@application/errors/NotAuthenticatedError";
import { CampaignService } from "@application/services/CampaignService";
import { PosterDesignService } from "@application/services/PosterDesignService";
import { CampaignId } from "@domain/campaign/CampaignId";
import { PosterDesignId } from "@domain/campaign/design/PosterDesignId";
import { NotFoundError } from "@domain/shared/NotFoundError";
import { ValidationError } from "@domain/shared/ValidationError";

import { FakeSessionProvider } from "./fakes/FakeSessionProvider";
import { InMemoryCampaignRepository } from "./fakes/InMemoryCampaignRepository";

const qrPlacement = { x: 10, y: 20, size: 100, rotation: 45 };

function image(type = "image/png", content = "png bytes") {
  return new Blob([content], { type });
}

let sessions: FakeSessionProvider;
let campaigns: InMemoryCampaignRepository;
let campaignService: CampaignService;
let service: PosterDesignService;
let campaignId: string;

beforeEach(async () => {
  sessions = new FakeSessionProvider("alice");
  campaigns = new InMemoryCampaignRepository();
  campaignService = new CampaignService(sessions, campaigns);
  service = new PosterDesignService(sessions, campaigns);
  ({ id: campaignId } = await campaignService.createCampaign({
    name: "Campaign",
    target: "https://example.com/",
  }));
});

describe("createPosterDesign", () => {
  it("adds a design to the campaign, with its image", async () => {
    await service.createPosterDesign(campaignId, {
      image: image(),
      qrPlacement,
    });

    const campaign = await campaignService.getMyCampaign(campaignId);
    expect(campaign?.posterDesigns).toEqual([
      { id: expect.any(String), qrPlacement },
    ]);
    const designId = campaign!.posterDesigns[0].id;
    expect(PosterDesignId.parse(designId)).toBe(designId);

    const stored = await service.getMyPosterDesignImage(designId);
    expect(stored?.contentType).toBe("image/png");
    expect(await new Response(stored?.data).text()).toBe("png bytes");
  });

  it("keeps the campaign's other designs", async () => {
    await service.createPosterDesign(campaignId, {
      image: image(),
      qrPlacement,
    });
    await service.createPosterDesign(campaignId, {
      image: image(),
      qrPlacement: { ...qrPlacement, x: 50 },
    });
    const campaign = await campaignService.getMyCampaign(campaignId);
    expect(campaign?.posterDesigns.map((d) => d.qrPlacement.x)).toEqual([
      10, 50,
    ]);
  });

  it.each([
    [
      "an out-of-range QR value",
      { image: image(), qrPlacement: { ...qrPlacement, rotation: -3 } },
    ],
    [
      "a NaN QR value",
      { image: image(), qrPlacement: { ...qrPlacement, x: NaN } },
    ],
    ["a non-image file", { image: image("application/pdf"), qrPlacement }],
    ["an empty image", { image: image("image/png", ""), qrPlacement }],
  ])("rejects %s before storing anything", async (_case, input) => {
    await expect(service.createPosterDesign(campaignId, input)).rejects.toThrow(
      ValidationError,
    );
    expect(campaigns.images.size).toBe(0);
    expect(
      (await campaignService.getMyCampaign(campaignId))?.posterDesigns,
    ).toEqual([]);
  });

  it("throws NotFoundError for another user's campaign", async () => {
    sessions.signInAs("bob");
    await expect(
      service.createPosterDesign(campaignId, { image: image(), qrPlacement }),
    ).rejects.toThrow(NotFoundError);
    expect(campaigns.images.size).toBe(0);
  });

  it("throws NotFoundError for a non-UUID or unknown campaign id", async () => {
    for (const id of ["1", CampaignId.generate()]) {
      await expect(
        service.createPosterDesign(id, { image: image(), qrPlacement }),
      ).rejects.toThrow(NotFoundError);
    }
  });
});

describe("getMyPosterDesignImage", () => {
  let designId: string;

  beforeEach(async () => {
    await service.createPosterDesign(campaignId, {
      image: image(),
      qrPlacement,
    });
    designId = (await campaignService.getMyCampaign(campaignId))!
      .posterDesigns[0].id;
  });

  it("returns null for another user's design", async () => {
    sessions.signInAs("bob");
    expect(await service.getMyPosterDesignImage(designId)).toBeNull();
  });

  it.each(["1", "not-a-uuid"])(
    "returns null for the non-UUID id %j",
    async (id) => {
      expect(await service.getMyPosterDesignImage(id)).toBeNull();
    },
  );

  it("returns null for an unknown id", async () => {
    expect(
      await service.getMyPosterDesignImage(PosterDesignId.generate()),
    ).toBeNull();
  });
});

describe("when signed out", () => {
  it("throws NotAuthenticatedError, whatever the input", async () => {
    sessions.signOut();
    await expect(
      service.createPosterDesign(campaignId, { image: image(), qrPlacement }),
    ).rejects.toThrow(NotAuthenticatedError);
    await expect(
      service.createPosterDesign("not-a-uuid", {
        image: image("text/plain"),
        qrPlacement: { ...qrPlacement, x: -1 },
      }),
    ).rejects.toThrow(NotAuthenticatedError);
    await expect(service.getMyPosterDesignImage("not-a-uuid")).rejects.toThrow(
      NotAuthenticatedError,
    );
    expect(campaigns.images.size).toBe(0);
  });
});
