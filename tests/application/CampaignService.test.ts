import { beforeEach, describe, expect, it } from "vitest";

import { NotAuthenticatedError } from "@application/errors/NotAuthenticatedError";
import { ScanTargetCopyError } from "@application/errors/ScanTargetCopyError";
import { CampaignService } from "@application/services/CampaignService";
import { PosterDesignService } from "@application/services/PosterDesignService";
import { CampaignId } from "@domain/campaign/CampaignId";
import { PosterId } from "@domain/poster/PosterId";
import { NotFoundError } from "@domain/shared/NotFoundError";
import { ValidationError } from "@domain/shared/ValidationError";

import { makePdf } from "../support/pdfs";
import { FakeSessionProvider } from "./fakes/FakeSessionProvider";
import { InMemoryCampaignPosterLookup } from "./fakes/InMemoryCampaignPosterLookup";
import { InMemoryCampaignRepository } from "./fakes/InMemoryCampaignRepository";
import { InMemoryScanTargetCopy } from "./fakes/InMemoryScanTargetCopy";

const fields = { name: "Campaign", target: "https://example.com/" };

let sessions: FakeSessionProvider;
let campaigns: InMemoryCampaignRepository;
let campaignPosters: InMemoryCampaignPosterLookup;
let scanTargets: InMemoryScanTargetCopy;
let service: CampaignService;

beforeEach(() => {
  sessions = new FakeSessionProvider("alice");
  campaigns = new InMemoryCampaignRepository();
  campaignPosters = new InMemoryCampaignPosterLookup();
  scanTargets = new InMemoryScanTargetCopy();
  service = new CampaignService(
    sessions,
    campaigns,
    campaignPosters,
    scanTargets,
  );
});

/** Adds `count` posters to the campaign, returning their ids. */
function addPosters(campaignId: string, count: number): PosterId[] {
  const ids = Array.from({ length: count }, () => PosterId.generate());
  campaignPosters.add(CampaignId.parse(campaignId)!, ...ids);
  return ids;
}

describe("createCampaign", () => {
  it("creates a campaign for the signed-in user", async () => {
    const dto = await service.createCampaign({
      name: "Summer",
      target: "  https://example.com/summer  ",
    });

    expect(CampaignId.parse(dto.id)).toBe(dto.id);
    expect(dto).toEqual({
      id: dto.id,
      name: "Summer",
      target: "https://example.com/summer",
      posterDesigns: [],
    });
    expect(campaigns.campaigns).toMatchObject([
      { id: dto.id, ownerId: "alice", name: "Summer" },
    ]);
  });

  it("rejects an invalid target without storing anything", async () => {
    await expect(
      service.createCampaign({ name: "Bad", target: "not a url" }),
    ).rejects.toThrow(ValidationError);
    expect(campaigns.campaigns).toEqual([]);
  });
});

describe("listMyCampaigns", () => {
  it("lists only the user's campaigns, in creation order", async () => {
    const first = await service.createCampaign({ ...fields, name: "First" });
    sessions.signInAs("bob");
    await service.createCampaign({ ...fields, name: "Bob's" });
    sessions.signInAs("alice");
    const second = await service.createCampaign({ ...fields, name: "Second" });

    const list = await service.listMyCampaigns();
    expect(list.map(({ id }) => id)).toEqual([first.id, second.id]);
  });
});

describe("getMyCampaign", () => {
  it("returns the user's campaign", async () => {
    const created = await service.createCampaign(fields);
    expect(await service.getMyCampaign(created.id)).toEqual(created);
  });

  it("returns null for another user's campaign", async () => {
    const created = await service.createCampaign(fields);
    sessions.signInAs("bob");
    expect(await service.getMyCampaign(created.id)).toBeNull();
  });

  it.each(["1", "not-a-uuid", ""])(
    "returns null for the non-UUID id %j",
    async (id) => {
      expect(await service.getMyCampaign(id)).toBeNull();
    },
  );

  it("returns null for an unknown id", async () => {
    expect(await service.getMyCampaign(CampaignId.generate())).toBeNull();
  });
});

describe("updateCampaign", () => {
  it("updates the name and target", async () => {
    const { id } = await service.createCampaign(fields);
    await service.updateCampaign(id, {
      name: "Renamed",
      target: " https://example.com/new ",
    });
    expect(await service.getMyCampaign(id)).toMatchObject({
      name: "Renamed",
      target: "https://example.com/new",
    });
  });

  it("keeps the campaign's designs and their images", async () => {
    const { id } = await service.createCampaign(fields);
    const designs = new PosterDesignService(sessions, campaigns);
    const qrPlacement = { x: 10, y: 20, size: 15, rotation: 45 };
    await designs.createPosterDesign(id, {
      image: new Blob([await makePdf(1)], { type: "application/pdf" }),
      qrPlacement,
    });

    await service.updateCampaign(id, fields);

    const campaign = await service.getMyCampaign(id);
    expect(campaign?.posterDesigns).toEqual([
      { id: expect.any(String), qrPlacement },
    ]);
    expect(campaigns.images.size).toBe(1);
    expect(
      await designs.getMyPosterDesignImage(campaign!.posterDesigns[0].id),
    ).not.toBeNull();
  });

  it("throws NotFoundError for another user's campaign", async () => {
    const { id } = await service.createCampaign(fields);
    sessions.signInAs("bob");
    await expect(service.updateCampaign(id, fields)).rejects.toThrow(
      NotFoundError,
    );
    sessions.signInAs("alice");
    expect(await service.getMyCampaign(id)).toMatchObject({ name: "Campaign" });
  });

  it("throws NotFoundError for a non-UUID or unknown id", async () => {
    await expect(service.updateCampaign("1", fields)).rejects.toThrow(
      NotFoundError,
    );
    await expect(
      service.updateCampaign(CampaignId.generate(), fields),
    ).rejects.toThrow(NotFoundError);
  });

  it("copies a changed target to every poster of the campaign, for the scan redirect", async () => {
    const { id } = await service.createCampaign(fields);
    const ids = [...addPosters(id, 2), ...addPosters(id, 1)];
    const other = await service.createCampaign(fields);
    const otherIds = addPosters(other.id, 1);

    await service.updateCampaign(id, {
      ...fields,
      target: "https://example.com/new",
    });

    expect(Object.fromEntries(scanTargets.targets)).toEqual(
      Object.fromEntries(
        ids.map((posterId) => [posterId, "https://example.com/new"]),
      ),
    );
    expect(scanTargets.targets.has(otherIds[0])).toBe(false);
  });

  it("repairs a copy a failure left behind when the campaign is saved again", async () => {
    const { id } = await service.createCampaign(fields);
    const [posterId] = addPosters(id, 1);
    const changed = { ...fields, target: "https://example.com/new" };
    scanTargets.fail = true;
    await expect(service.updateCampaign(id, changed)).rejects.toThrow();

    scanTargets.fail = false;
    await service.updateCampaign(id, changed);

    expect(scanTargets.targets.get(posterId)).toBe("https://example.com/new");
  });

  it("throws ScanTargetCopyError if the copy fails, having saved the campaign", async () => {
    const { id } = await service.createCampaign(fields);
    addPosters(id, 1);
    scanTargets.fail = true;

    await expect(
      service.updateCampaign(id, {
        name: "Renamed",
        target: "https://example.com/new",
      }),
    ).rejects.toThrow(ScanTargetCopyError);

    expect(await service.getMyCampaign(id)).toMatchObject({
      name: "Renamed",
      target: "https://example.com/new",
    });
  });

  it("rejects an invalid target without saving", async () => {
    const { id } = await service.createCampaign(fields);
    await expect(
      service.updateCampaign(id, { name: "Renamed", target: "ftp://x" }),
    ).rejects.toThrow(ValidationError);
    expect(await service.getMyCampaign(id)).toMatchObject({ name: "Campaign" });
  });
});

describe("when signed out", () => {
  it("throws NotAuthenticatedError from every use case, whatever the input", async () => {
    const { id } = await service.createCampaign(fields);
    sessions.signOut();

    await expect(service.listMyCampaigns()).rejects.toThrow(
      NotAuthenticatedError,
    );
    for (const campaignId of [id, "not-a-uuid"]) {
      await expect(service.getMyCampaign(campaignId)).rejects.toThrow(
        NotAuthenticatedError,
      );
      await expect(
        service.updateCampaign(campaignId, { name: "", target: "invalid" }),
      ).rejects.toThrow(NotAuthenticatedError);
    }
    await expect(
      service.createCampaign({ name: "", target: "invalid" }),
    ).rejects.toThrow(NotAuthenticatedError);
  });
});
