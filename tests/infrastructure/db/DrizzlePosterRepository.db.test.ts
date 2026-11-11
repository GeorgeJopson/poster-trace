import { beforeEach, describe, expect, it } from "vitest";

import { Campaign } from "@domain/campaign/Campaign";
import { CampaignTarget } from "@domain/campaign/CampaignTarget";
import { PosterDesignImage } from "@domain/campaign/design/PosterDesignImage";
import { QrPlacement } from "@domain/campaign/design/QrPlacement";
import { AlreadyRegisteredError } from "@domain/poster/AlreadyRegisteredError";
import { Poster } from "@domain/poster/Poster";
import { PosterId } from "@domain/poster/PosterId";
import { PosterName } from "@domain/poster/PosterName";
import { RegistrationLocation } from "@domain/poster/RegistrationLocation";
import { PosterDesignId } from "@domain/campaign/design/PosterDesignId";
import { UserId } from "@domain/user/UserId";
import {
  campaign as campaignTable,
  poster as posterTable,
  registration as registrationTable,
} from "@infrastructure/db/schema";
import { DrizzleCampaignRepository } from "@infrastructure/repositories/DrizzleCampaignRepository";
import { DrizzlePosterRepository } from "@infrastructure/repositories/DrizzlePosterRepository";

import { A4_PDF_DETAILS } from "../../support/pdfs";
import { FakeBlobStore } from "./FakeBlobStore";
import { clearDatabase, db, insertUser } from "./testDb";

const alice = UserId.from("alice");

let repository: DrizzlePosterRepository;
let designId: PosterDesignId;

beforeEach(async () => {
  await clearDatabase();
  await insertUser(alice);
  const campaigns = new DrizzleCampaignRepository(db, new FakeBlobStore());
  const campaign = Campaign.create(
    alice,
    "Campaign",
    CampaignTarget.create("https://example.com/"),
  );
  const design = campaign.addDesign(
    QrPlacement.create({ x: 10, y: 10, size: 20, rotation: 0 }),
    PosterDesignImage.create(new Blob(["pdf"]), A4_PDF_DETAILS),
  );
  await campaigns.save(campaign);
  designId = design.id;
  repository = new DrizzlePosterRepository(db);
});

const registeredAt = new Date("2026-11-09T12:34:56.789Z");
const locationValues = { latitude: 51.501, longitude: -0.142, accuracy: 12.5 };
const location = RegistrationLocation.create(locationValues);
const gentleSwamp = PosterName.create("Gentle Swamp");

// The repository can't list posters, so these check the rows directly.
async function storedPosters() {
  return db
    .select({ id: posterTable.id, designId: posterTable.posterDesignId })
    .from(posterTable);
}

describe("addAll", () => {
  it("stores the posters under the domain's ids", async () => {
    const posters = Poster.generate(designId, 3);
    await repository.addAll(posters);

    expect(await storedPosters()).toEqual(
      expect.arrayContaining(posters.map(({ id }) => ({ id, designId }))),
    );
    expect(await storedPosters()).toHaveLength(3);
  });

  it("stores none of the posters if one can't be stored", async () => {
    const [valid] = Poster.generate(designId, 1);
    const [orphan] = Poster.generate(PosterDesignId.generate(), 1);
    await expect(repository.addAll([valid, orphan])).rejects.toThrow();
    expect(await storedPosters()).toEqual([]);
  });

  it("does nothing for no posters", async () => {
    await repository.addAll([]);
    expect(await storedPosters()).toEqual([]);
  });

  it("is deleted with its owner", async () => {
    await repository.addAll(Poster.generate(designId, 2));
    await clearDatabase();
    expect(await storedPosters()).toEqual([]);
  });
});

describe("findById", () => {
  it("finds a stored poster", async () => {
    const [poster] = Poster.generate(designId, 1);
    await repository.addAll([poster]);

    const found = await repository.findById(poster.id);

    expect(found?.id).toBe(poster.id);
    expect(found?.designId).toBe(designId);
  });

  it("loads the poster's registration", async () => {
    const [poster] = Poster.generate(designId, 1);
    await repository.addAll([poster]);
    poster.register(gentleSwamp, location, registeredAt);
    await repository.addRegistration(poster);

    expect((await repository.findById(poster.id))?.registration).toEqual({
      posterName: gentleSwamp,
      registeredAt,
      location,
    });
  });

  it("loads a registration without a location", async () => {
    const [poster] = Poster.generate(designId, 1);
    await repository.addAll([poster]);
    poster.register(gentleSwamp, null, registeredAt);
    await repository.addRegistration(poster);

    expect(
      (await repository.findById(poster.id))?.registration?.location,
    ).toBeNull();
  });

  it("gives an unregistered poster no registration", async () => {
    const [poster] = Poster.generate(designId, 1);
    await repository.addAll([poster]);

    expect((await repository.findById(poster.id))?.registration).toBeNull();
  });

  it("returns null for an unknown poster", async () => {
    expect(await repository.findById(PosterId.generate())).toBeNull();
  });
});

describe("addRegistration", () => {
  async function storedRegistrations() {
    return db.select().from(registrationTable);
  }

  it("stores the poster's registration", async () => {
    const [poster] = Poster.generate(designId, 1);
    await repository.addAll([poster]);
    poster.register(gentleSwamp, location, registeredAt);

    await repository.addRegistration(poster);

    expect(await storedRegistrations()).toEqual([
      {
        posterId: poster.id,
        posterName: "Gentle Swamp",
        registeredAt,
        ...locationValues,
      },
    ]);
  });

  it("throws AlreadyRegisteredError when the poster's already registered", async () => {
    const [poster] = Poster.generate(designId, 1);
    await repository.addAll([poster]);
    // Two people load the unregistered poster at the same moment.
    const first = (await repository.findById(poster.id))!;
    const second = (await repository.findById(poster.id))!;
    first.register(gentleSwamp, location, registeredAt);
    second.register(PosterName.create("Quiet Harbour"), null, registeredAt);
    await repository.addRegistration(first);

    await expect(repository.addRegistration(second)).rejects.toThrow(
      AlreadyRegisteredError,
    );
    expect(await storedRegistrations()).toEqual([
      expect.objectContaining({ posterName: "Gentle Swamp" }),
    ]);
  });

  it("fails for a poster that isn't stored", async () => {
    const [poster] = Poster.generate(designId, 1);
    poster.register(gentleSwamp, null, registeredAt);

    const error = await repository.addRegistration(poster).catch((e) => e);

    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(AlreadyRegisteredError);
  });

  it("is deleted with the poster's campaign", async () => {
    const [poster] = Poster.generate(designId, 1);
    await repository.addAll([poster]);
    poster.register(gentleSwamp, location, registeredAt);
    await repository.addRegistration(poster);

    await db.delete(campaignTable);

    expect(await storedRegistrations()).toEqual([]);
  });
});
