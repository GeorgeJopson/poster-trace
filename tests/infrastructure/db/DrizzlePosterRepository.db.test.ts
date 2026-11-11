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
  it("stores the posters under the domain's ids", async () => {
    const posters = Poster.generate(designId, 3);
    await repository.save(posters);

    expect(await storedPosters()).toEqual(
      expect.arrayContaining(posters.map(({ id }) => ({ id, designId }))),
    );
    expect(await storedPosters()).toHaveLength(3);
  });

  it("stores none of the posters if one can't be stored", async () => {
    const [valid] = Poster.generate(designId, 1);
    const [orphan] = Poster.generate(PosterDesignId.generate(), 1);
    await expect(repository.save([valid, orphan])).rejects.toThrow();
    expect(await storedPosters()).toEqual([]);
  });

  it("does nothing for no posters", async () => {
    await repository.save([]);
    expect(await storedPosters()).toEqual([]);
  });

  it("is deleted with its owner", async () => {
    await repository.save(Poster.generate(designId, 2));
    await clearDatabase();
    expect(await storedPosters()).toEqual([]);
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

describe("save with a registration", () => {
  async function storedRegistrations() {
    return db.select().from(registrationTable);
  }

  it("stores the poster's registration", async () => {
    const [poster] = Poster.generate(designId, 1);
    await repository.save(poster);
    poster.register(gentleSwamp, location, registeredAt);

    await repository.save(poster);

    expect(await storedRegistrations()).toEqual([
      {
        posterId: poster.id,
        posterName: "Gentle Swamp",
        registeredAt,
        ...locationValues,
      },
    ]);
  });

  it("never overwrites a stored registration", async () => {
    const [poster] = Poster.generate(designId, 1);
    await repository.save(poster);
    // Two people load the unregistered poster at the same moment. The race
    // is accepted: the second save stores nothing (ADR-0018).
    const first = (await repository.findById(poster.id))!;
    const second = (await repository.findById(poster.id))!;
    first.register(gentleSwamp, location, registeredAt);
    second.register(PosterName.create("Quiet Harbour"), null, registeredAt);
    await repository.save(first);

    await repository.save(second);

    expect(await storedRegistrations()).toEqual([
      expect.objectContaining({ posterName: "Gentle Swamp" }),
    ]);
  });

  it("stores a new poster with its registration", async () => {
    const [poster] = Poster.generate(designId, 1);
    poster.register(gentleSwamp, null, registeredAt);

    await repository.save(poster);

    expect(await storedPosters()).toEqual([{ id: poster.id, designId }]);
    expect(await storedRegistrations()).toEqual([
      expect.objectContaining({ posterId: poster.id, latitude: null }),
    ]);
  });

  it("stores the registrations of many posters", async () => {
    const posters = Poster.generate(designId, 2);
    posters[0].register(gentleSwamp, location, registeredAt);
    posters[1].register(PosterName.create("Quiet Harbour"), null, registeredAt);

    await repository.save(posters);

    expect(await storedRegistrations()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ posterId: posters[0].id }),
        expect.objectContaining({ posterId: posters[1].id }),
      ]),
    );
    expect(await storedRegistrations()).toHaveLength(2);
  });

  it("can save the same poster again", async () => {
    const [poster] = Poster.generate(designId, 1);
    poster.register(gentleSwamp, location, registeredAt);
    await repository.save(poster);

    await repository.save(poster);

    expect(await storedPosters()).toHaveLength(1);
    expect(await storedRegistrations()).toHaveLength(1);
  });

  it("is deleted with the poster's campaign", async () => {
    const [poster] = Poster.generate(designId, 1);
    await repository.save(poster);
    poster.register(gentleSwamp, location, registeredAt);
    await repository.save(poster);

    await db.delete(campaignTable);

    expect(await storedRegistrations()).toEqual([]);
  });
});
