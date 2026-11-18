import { beforeEach, describe, expect, it } from "vitest";

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
import { DrizzlePosterRepository } from "@infrastructure/repositories/DrizzlePosterRepository";

import { clearDatabase, db, insertDesign, insertUser } from "./testDb";

const alice = UserId.from("alice");

let repository: DrizzlePosterRepository;
let designId: PosterDesignId;

beforeEach(async () => {
  await clearDatabase();
  await insertUser(alice);
  designId = await insertDesign(alice);
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

describe("save", () => {
  async function storedRegistrations() {
    return db.select().from(registrationTable);
  }

  it("stores new posters under the domain's ids", async () => {
    const posters = Poster.generate(designId, 3);
    await repository.save(posters);

    expect(await storedPosters()).toEqual(
      expect.arrayContaining(posters.map(({ id }) => ({ id, designId }))),
    );
    expect(await storedPosters()).toHaveLength(3);
    expect(await storedRegistrations()).toEqual([]);
  });

  it("stores a single poster", async () => {
    const [poster] = Poster.generate(designId, 1);
    await repository.save(poster);

    expect(await storedPosters()).toEqual([{ id: poster.id, designId }]);
  });

  it("stores the registration of a stored poster", async () => {
    const [poster] = Poster.generate(designId, 1);
    await repository.save(poster);
    poster.register(gentleSwamp, location, registeredAt);

    await repository.save(poster);

    expect(await storedPosters()).toEqual([{ id: poster.id, designId }]);
    expect(await storedRegistrations()).toEqual([
      {
        posterId: poster.id,
        posterName: "Gentle Swamp",
        registeredAt,
        ...locationValues,
      },
    ]);
  });

  it("stores a new poster along with its registration", async () => {
    const [poster] = Poster.generate(designId, 1);
    poster.register(gentleSwamp, null, registeredAt);

    await repository.save(poster);

    expect(await storedPosters()).toEqual([{ id: poster.id, designId }]);
    expect(await storedRegistrations()).toEqual([
      expect.objectContaining({ posterId: poster.id, latitude: null }),
    ]);
  });

  it("can save a registered poster again", async () => {
    const [poster] = Poster.generate(designId, 1);
    poster.register(gentleSwamp, location, registeredAt);
    await repository.save(poster);

    await repository.save((await repository.findById(poster.id))!);

    expect(await storedRegistrations()).toEqual([
      expect.objectContaining({ posterName: "Gentle Swamp" }),
    ]);
  });

  it("lets the last registration win when two people register at the same moment", async () => {
    // Accepted: only the domain stops a second registration (ADR-0018).
    const [poster] = Poster.generate(designId, 1);
    await repository.save(poster);
    const first = (await repository.findById(poster.id))!;
    const second = (await repository.findById(poster.id))!;
    first.register(gentleSwamp, location, registeredAt);
    second.register(PosterName.create("Quiet Harbour"), null, registeredAt);

    await repository.save(first);
    await repository.save(second);

    expect(await storedRegistrations()).toEqual([
      {
        posterId: poster.id,
        posterName: "Quiet Harbour",
        registeredAt,
        latitude: null,
        longitude: null,
        accuracy: null,
      },
    ]);
  });

  it("never deletes a registration missing from the poster", async () => {
    const [poster] = Poster.generate(designId, 1);
    await repository.save(poster);
    const stale = (await repository.findById(poster.id))!;
    poster.register(gentleSwamp, location, registeredAt);
    await repository.save(poster);

    await repository.save(stale);

    expect(await storedRegistrations()).toEqual([
      expect.objectContaining({ posterName: "Gentle Swamp" }),
    ]);
  });

  it("stores none of the posters if one can't be stored", async () => {
    const [valid] = Poster.generate(designId, 1);
    const [orphan] = Poster.generate(PosterDesignId.generate(), 1);
    await expect(repository.save([valid, orphan])).rejects.toThrow();
    expect(await storedPosters()).toEqual([]);
  });

  it("stores no registrations if one of the posters can't be stored", async () => {
    const [valid] = Poster.generate(designId, 1);
    valid.register(gentleSwamp, null, registeredAt);
    const [orphan] = Poster.generate(PosterDesignId.generate(), 1);
    await expect(repository.save([valid, orphan])).rejects.toThrow();
    expect(await storedPosters()).toEqual([]);
    expect(await storedRegistrations()).toEqual([]);
  });

  it("does nothing for no posters", async () => {
    await repository.save([]);
    expect(await storedPosters()).toEqual([]);
  });

  it("deletes posters and registrations with their campaign", async () => {
    const posters = Poster.generate(designId, 2);
    posters[0].register(gentleSwamp, location, registeredAt);
    await repository.save(posters);

    await db.delete(campaignTable);

    expect(await storedPosters()).toEqual([]);
    expect(await storedRegistrations()).toEqual([]);
  });
});

describe("findById", () => {
  it("finds a stored poster", async () => {
    const [poster] = Poster.generate(designId, 1);
    await repository.save(poster);

    const found = await repository.findById(poster.id);

    expect(found?.id).toBe(poster.id);
    expect(found?.designId).toBe(designId);
  });

  it("loads the poster's registration", async () => {
    const [poster] = Poster.generate(designId, 1);
    await repository.save(poster);
    poster.register(gentleSwamp, location, registeredAt);
    await repository.save(poster);

    expect((await repository.findById(poster.id))?.registration).toEqual({
      posterName: gentleSwamp,
      registeredAt,
      location,
    });
  });

  it("loads a registration without a location", async () => {
    const [poster] = Poster.generate(designId, 1);
    await repository.save(poster);
    poster.register(gentleSwamp, null, registeredAt);
    await repository.save(poster);

    expect(
      (await repository.findById(poster.id))?.registration?.location,
    ).toBeNull();
  });

  it("gives an unregistered poster no registration", async () => {
    const [poster] = Poster.generate(designId, 1);
    await repository.save(poster);

    expect((await repository.findById(poster.id))?.registration).toBeNull();
  });

  it("returns null for an unknown poster", async () => {
    expect(await repository.findById(PosterId.generate())).toBeNull();
  });
});
