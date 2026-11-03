import { beforeEach, describe, expect, it } from "vitest";

import { Campaign } from "@domain/campaign/Campaign";
import { CampaignId } from "@domain/campaign/CampaignId";
import { CampaignTarget } from "@domain/campaign/CampaignTarget";
import { PosterDesign } from "@domain/campaign/design/PosterDesign";
import { PosterDesignId } from "@domain/campaign/design/PosterDesignId";
import { PosterDesignImageUpload } from "@domain/campaign/design/PosterDesignImageUpload";
import { QrPlacement } from "@domain/campaign/design/QrPlacement";
import { NotFoundError } from "@domain/shared/NotFoundError";
import { UserId } from "@domain/user/UserId";
import { DrizzleCampaignRepository } from "@infrastructure/repositories/DrizzleCampaignRepository";

import { FakeBlobStore } from "./FakeBlobStore";
import { clearDatabase, db, insertUser } from "./testDb";

const alice = UserId.from("alice");
const bob = UserId.from("bob");
const target = CampaignTarget.create("https://example.com/");
const placement = QrPlacement.create({
  x: 10,
  y: 20.5,
  size: 300,
  rotation: 45,
});

function upload(contentType = "image/png") {
  // The blob's own type differs, to show the validated type is what's stored.
  return PosterDesignImageUpload.create(
    new Blob(["image bytes"], { type: "application/octet-stream" }),
    contentType,
  );
}

let blobStore: FakeBlobStore;
let repository: DrizzleCampaignRepository;

beforeEach(async () => {
  await clearDatabase();
  await insertUser(alice);
  await insertUser(bob);
  blobStore = new FakeBlobStore();
  repository = new DrizzleCampaignRepository(db, blobStore);
});

async function addCampaign(ownerId = alice, name = "Campaign") {
  const campaign = Campaign.create(ownerId, name, target);
  await repository.add(campaign);
  return campaign;
}

async function addDesign(campaign: Campaign) {
  const design = campaign.addDesign(placement);
  await repository.addDesign(campaign, design, upload());
  return design;
}

describe("add / findByIdForOwner", () => {
  it("stores the campaign under the domain's id", async () => {
    const campaign = await addCampaign();

    const loaded = await repository.findByIdForOwner(campaign.id, alice);
    expect(loaded?.id).toBe(campaign.id);
    expect(loaded?.ownerId).toBe(alice);
    expect(loaded?.getName()).toBe("Campaign");
    expect(loaded?.getTarget().value).toBe(target.value);
    expect(loaded?.getDesigns()).toEqual([]);
  });

  it("returns null for another owner's or an unknown campaign", async () => {
    const campaign = await addCampaign();
    expect(await repository.findByIdForOwner(campaign.id, bob)).toBeNull();
    expect(
      await repository.findByIdForOwner(CampaignId.generate(), alice),
    ).toBeNull();
  });
});

describe("findAllByOwner", () => {
  it("returns only the owner's campaigns, oldest first, with designs in order", async () => {
    const first = await addCampaign(alice, "First");
    await addCampaign(bob, "Bob's");
    const second = await addCampaign(alice, "Second");
    const third = await addCampaign(alice, "Third");
    const designs = [await addDesign(second), await addDesign(second)];
    designs.push(await addDesign(second));

    const campaigns = await repository.findAllByOwner(alice);
    expect(campaigns.map((c) => c.id)).toEqual([first.id, second.id, third.id]);
    expect(campaigns[1].getDesigns().map((d) => d.id)).toEqual(
      designs.map((d) => d.id),
    );
  });
});

describe("updateDetails", () => {
  it("saves the name and target only, never the designs", async () => {
    const campaign = await addCampaign();
    const saved = await addDesign(campaign);

    const loaded = (await repository.findByIdForOwner(campaign.id, alice))!;
    loaded.addDesign(placement);
    loaded.updateDetails(
      "Renamed",
      CampaignTarget.create("https://example.com/new"),
    );
    await repository.updateDetails(loaded);

    const reloaded = await repository.findByIdForOwner(campaign.id, alice);
    expect(reloaded?.getName()).toBe("Renamed");
    expect(reloaded?.getTarget().value).toBe("https://example.com/new");
    expect(reloaded?.getDesigns().map((d) => d.id)).toEqual([saved.id]);
  });

  it("throws NotFoundError if the campaign isn't owned by its ownerId", async () => {
    const campaign = await addCampaign();
    const asBob = Campaign.restore({
      id: campaign.id,
      ownerId: bob,
      name: "Stolen",
      target,
      designs: [],
    });

    await expect(repository.updateDetails(asBob)).rejects.toThrow(
      NotFoundError,
    );
    expect(
      (await repository.findByIdForOwner(campaign.id, alice))?.getName(),
    ).toBe("Campaign");
  });
});

describe("addDesign", () => {
  it("stores the design under its id, with its image", async () => {
    const campaign = await addCampaign();
    const design = campaign.addDesign(placement);
    await repository.addDesign(campaign, design, upload("image/webp"));

    const loaded = await repository.findByIdForOwner(campaign.id, alice);
    const [stored] = loaded!.getDesigns();
    expect(stored.id).toBe(design.id);
    expect({ ...stored.qrPlacement }).toEqual({ ...placement });

    expect(blobStore.blobs.size).toBe(1);
    const [blob] = blobStore.blobs.values();
    expect(blob.contentType).toBe("image/webp");

    const image = await repository.findDesignImageForOwner(design.id, alice);
    expect(image?.contentType).toBe("image/webp");
    expect(await new Response(image?.data).text()).toBe("image bytes");
  });

  it("rejects a design that isn't in the campaign", async () => {
    const campaign = await addCampaign();
    await expect(
      repository.addDesign(campaign, PosterDesign.create(placement), upload()),
    ).rejects.toThrow("isn't one of the campaign's designs");
    expect(blobStore.blobs.size).toBe(0);
  });

  it("throws NotFoundError if the campaign isn't owned by its ownerId", async () => {
    const campaign = await addCampaign();
    const asBob = Campaign.restore({
      id: campaign.id,
      ownerId: bob,
      name: "Campaign",
      target,
      designs: [],
    });
    const design = asBob.addDesign(placement);

    await expect(repository.addDesign(asBob, design, upload())).rejects.toThrow(
      NotFoundError,
    );
    expect(blobStore.blobs.size).toBe(0);
  });

  it("deletes the image if the design can't be inserted", async () => {
    const campaign = await addCampaign();
    const existing = await addDesign(campaign);
    // A design with an id that's already taken fails to insert.
    const duplicate = PosterDesign.restore({
      id: existing.id,
      qrPlacement: placement,
    });
    const restored = Campaign.restore({
      id: campaign.id,
      ownerId: alice,
      name: "Campaign",
      target,
      designs: [duplicate],
    });

    await expect(
      repository.addDesign(restored, duplicate, upload()),
    ).rejects.toThrow();
    expect(blobStore.blobs.size).toBe(1);
  });
});

describe("findDesignImageForOwner", () => {
  it("returns null for another owner's or an unknown design", async () => {
    const design = await addDesign(await addCampaign());
    expect(await repository.findDesignImageForOwner(design.id, bob)).toBeNull();
    expect(
      await repository.findDesignImageForOwner(
        PosterDesignId.generate(),
        alice,
      ),
    ).toBeNull();
  });
});

describe("findAllDesignImageRefsByOwner / deleteDesignImages", () => {
  it("finds and deletes every image of the owner's campaigns", async () => {
    await addDesign(await addCampaign());
    const second = await addCampaign();
    await addDesign(second);
    await addDesign(second);
    await addDesign(await addCampaign(bob));
    const bobKeys = new Set(blobStore.blobs.keys());

    const refs = await repository.findAllDesignImageRefsByOwner(alice);
    expect(refs).toHaveLength(3);
    for (const ref of refs) bobKeys.delete(ref);
    expect(bobKeys.size).toBe(1);

    await repository.deleteDesignImages(refs);
    expect([...blobStore.blobs.keys()]).toEqual([...bobKeys]);
  });
});
