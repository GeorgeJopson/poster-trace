import { beforeEach, describe, expect, it } from "vitest";

import { Campaign } from "@domain/campaign/Campaign";
import { CampaignId } from "@domain/campaign/CampaignId";
import { CampaignTarget } from "@domain/campaign/CampaignTarget";
import { PosterDesign } from "@domain/campaign/design/PosterDesign";
import { PosterDesignId } from "@domain/campaign/design/PosterDesignId";
import { PosterDesignImage } from "@domain/campaign/design/PosterDesignImage";
import { QrPlacement } from "@domain/campaign/design/QrPlacement";
import { NotFoundError } from "@domain/shared/NotFoundError";
import { UserId } from "@domain/user/UserId";
import { DrizzleCampaignRepository } from "@infrastructure/repositories/DrizzleCampaignRepository";

import { A4_PDF_DETAILS } from "../../support/pdfs";
import { FakeBlobStore } from "./FakeBlobStore";
import { clearDatabase, db, insertUser } from "./testDb";

const alice = UserId.from("alice");
const bob = UserId.from("bob");
const target = CampaignTarget.create("https://example.com/");
const placement = QrPlacement.create({
  x: 10,
  y: 20.5,
  size: 30,
  rotation: 45,
});

function upload() {
  // The blob's own type differs, to show the validated type is what's stored.
  return PosterDesignImage.create(
    new Blob(["image bytes"], { type: "application/octet-stream" }),
    A4_PDF_DETAILS,
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
  await repository.save(campaign);
  return campaign;
}

async function addDesign(campaign: Campaign) {
  const design = campaign.addDesign(placement, upload());
  await repository.save(campaign);
  return design;
}

async function load(campaign: Campaign) {
  return (await repository.findByIdForOwner(campaign.id, campaign.ownerId))!;
}

const moved = QrPlacement.create({ x: 1, y: 2, size: 3, rotation: 4 });

describe("save / findByIdForOwner", () => {
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

describe("save", () => {
  it("stores new designs under their ids, with their images, in order", async () => {
    const campaign = Campaign.create(alice, "Campaign", target);
    const first = campaign.addDesign(placement, upload());
    const second = campaign.addDesign(placement, upload());
    await repository.save(campaign);

    const designs = (await load(campaign)).getDesigns();
    expect(designs.map((d) => d.id)).toEqual([first.id, second.id]);
    expect({ ...designs[0].qrPlacement }).toEqual({ ...placement });

    expect(blobStore.blobs.size).toBe(2);
    const [blob] = blobStore.blobs.values();
    expect(blob.contentType).toBe("application/pdf");

    const image = await repository.findDesignImageForOwner(first.id, alice);
    expect(image?.contentType).toBe("application/pdf");
    expect(await new Response(image?.data).text()).toBe("image bytes");
  });

  it("updates the name, target and stored designs' placements", async () => {
    const campaign = await addCampaign();
    const design = await addDesign(campaign);

    const changed = Campaign.restore({
      id: campaign.id,
      ownerId: alice,
      name: "Renamed",
      target: CampaignTarget.create("https://example.com/new"),
      designs: [
        PosterDesign.restore({
          id: design.id,
          qrPlacement: moved,
          loadImage: async () => null,
        }),
      ],
    });
    await repository.save(changed);

    const reloaded = await load(campaign);
    expect(reloaded.getName()).toBe("Renamed");
    expect(reloaded.getTarget().value).toBe("https://example.com/new");
    const [stored] = reloaded.getDesigns();
    expect(stored.id).toBe(design.id);
    expect({ ...stored.qrPlacement }).toEqual({ ...moved });
    expect(blobStore.blobs.size).toBe(1);
  });

  it("doesn't keep a second image when the same campaign is saved twice", async () => {
    const campaign = Campaign.create(alice, "Campaign", target);
    const design = campaign.addDesign(placement, upload());
    await repository.save(campaign);
    const [key] = blobStore.blobs.keys();

    await repository.save(campaign);

    expect([...blobStore.blobs.keys()]).toEqual([key]);
    expect((await load(campaign)).getDesigns().map((d) => d.id)).toEqual([
      design.id,
    ]);
  });

  it("keeps stored designs that are missing from a stale copy", async () => {
    const campaign = await addCampaign();
    const stale = await load(campaign);
    const added = await addDesign(await load(campaign));

    stale.setName("Renamed");
    await repository.save(stale);

    const reloaded = await load(campaign);
    expect(reloaded.getName()).toBe("Renamed");
    expect(reloaded.getDesigns().map((d) => d.id)).toEqual([added.id]);
  });

  it("stores nothing in the database if an upload fails", async () => {
    let uploads = 0;
    const set = blobStore.set.bind(blobStore);
    blobStore.set = async (key, data, contentType) => {
      if (++uploads === 2) throw new Error("upload failed");
      await set(key, data, contentType);
    };
    const campaign = Campaign.create(alice, "Campaign", target);
    campaign.addDesign(placement, upload());
    campaign.addDesign(placement, upload());

    await expect(repository.save(campaign)).rejects.toThrow("upload failed");
    expect(await repository.findByIdForOwner(campaign.id, alice)).toBeNull();
    // The first upload is left for the clean-up job (ADR-0013).
    expect(blobStore.blobs.size).toBe(1);
  });

  it("throws NotFoundError and writes nothing for another owner's campaign", async () => {
    const campaign = await addCampaign();
    const asBob = Campaign.restore({
      id: campaign.id,
      ownerId: bob,
      name: "Stolen",
      target,
      designs: [],
    });
    asBob.addDesign(placement, upload());

    await expect(repository.save(asBob)).rejects.toThrow(NotFoundError);
    const reloaded = await load(campaign);
    expect(reloaded.getName()).toBe("Campaign");
    expect(reloaded.getDesigns()).toEqual([]);
    expect(blobStore.blobs.size).toBe(0);
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
    const bobsDesign = await addDesign(await addCampaign(bob));
    const campaign = await addCampaign();

    const attempt = Campaign.restore({
      id: campaign.id,
      ownerId: alice,
      name: "Renamed",
      target,
      designs: [
        PosterDesign.restore({
          id: designId(bobsDesign.id),
          qrPlacement: moved,
          loadImage: async () => null,
        }),
      ],
    });
    // Also carries a new design, whose image mustn't be left behind.
    attempt.addDesign(placement, upload());

    await expect(repository.save(attempt)).rejects.toThrow(NotFoundError);
    const reloaded = await load(campaign);
    expect(reloaded.getName()).toBe("Campaign");
    expect(reloaded.getDesigns()).toEqual([]);
    const [bobs] = (await repository.findAllByOwner(bob))[0].getDesigns();
    expect({ ...bobs.qrPlacement }).toEqual({ ...placement });
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

describe("loadImage", () => {
  it("loads a stored design's image", async () => {
    const design = await addDesign(await addCampaign());

    const [loaded] = (await repository.findAllByOwner(alice))[0].getDesigns();
    expect(loaded.id).toBe(design.id);
    expect(loaded.image).toBeUndefined();
    const image = await loaded.loadImage();
    expect(image.contentType).toBe("application/pdf");
    expect(await image.data.text()).toBe("image bytes");
  });

  it("throws if the stored image is missing", async () => {
    const campaign = await addCampaign();
    await addDesign(campaign);
    blobStore.blobs.clear();

    const [design] = (await load(campaign)).getDesigns();
    await expect(design.loadImage()).rejects.toThrow(
      "Poster design image is missing",
    );
  });
});
