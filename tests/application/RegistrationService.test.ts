import { beforeEach, describe, expect, it } from "vitest";

import { RegistrationService } from "@application/services/RegistrationService";
import { PosterDesignId } from "@domain/campaign/design/PosterDesignId";
import { AlreadyRegisteredError } from "@domain/poster/AlreadyRegisteredError";
import { Poster } from "@domain/poster/Poster";
import { PosterId } from "@domain/poster/PosterId";
import { PosterName } from "@domain/poster/PosterName";
import { NotFoundError } from "@domain/shared/NotFoundError";
import { ValidationError } from "@domain/shared/ValidationError";

import { InMemoryPosterRepository } from "./fakes/InMemoryPosterRepository";

const now = new Date("2026-11-09T12:00:00Z");
const location = { latitude: 51.5, longitude: -0.12, accuracy: 8 };

let posters: InMemoryPosterRepository;
let service: RegistrationService;

beforeEach(() => {
  posters = new InMemoryPosterRepository();
  service = new RegistrationService(posters, () => now);
});

async function storedPoster() {
  const [poster] = Poster.generate(PosterDesignId.generate(), 1);
  await posters.save(poster);
  return poster;
}

describe("register", () => {
  it("stores the poster name, location and the server's time", async () => {
    const poster = await storedPoster();

    await service.register(poster.id, "Gentle Swamp", location);

    expect(posters.registrations).toEqual([
      {
        posterId: poster.id,
        posterName: "Gentle Swamp",
        registeredAt: now,
        location,
      },
    ]);
  });

  it("stores a registration without a location", async () => {
    const poster = await storedPoster();

    await service.register(poster.id, "Gentle Swamp", null);

    expect(posters.registrations).toEqual([
      expect.objectContaining({ posterId: poster.id, location: null }),
    ]);
  });

  it("rejects a second registration and keeps the first", async () => {
    const poster = await storedPoster();
    await service.register(poster.id, "Gentle Swamp", location);

    await expect(
      service.register(poster.id, "Quiet Harbour", null),
    ).rejects.toThrow(AlreadyRegisteredError);
    expect(posters.registrations).toEqual([
      expect.objectContaining({ posterName: "Gentle Swamp", location }),
    ]);
  });

  it("rejects a registration made at the same moment as someone else's", async () => {
    const poster = await storedPoster();
    // Someone else registers it between this one's load and save.
    const findById = posters.findById.bind(posters);
    posters.findById = async (id) => {
      const loaded = await findById(id);
      const theirs = (await findById(id))!;
      theirs.register(PosterName.create("Gentle Swamp"), null, now);
      await posters.save(theirs);
      return loaded;
    };

    await expect(
      service.register(poster.id, "Quiet Harbour", null),
    ).rejects.toThrow(AlreadyRegisteredError);
    expect(posters.registrations).toEqual([
      expect.objectContaining({ posterName: "Gentle Swamp" }),
    ]);
  });

  it.each([
    ["an unknown poster id", () => PosterId.generate()],
    ["a non-UUID poster id", () => "not-a-uuid"],
  ])("throws NotFoundError for %s", async (_case, posterId) => {
    await expect(
      service.register(posterId(), "Gentle Swamp", null),
    ).rejects.toThrow(NotFoundError);
    expect(posters.registrations).toEqual([]);
  });
});

describe("register's checks", () => {
  it("trims the poster name", async () => {
    const poster = await storedPoster();

    await service.register(poster.id, "  Gentle Swamp \n", null);

    expect(posters.registrations[0].posterName).toBe("Gentle Swamp");
  });

  it.each([
    ["a blank poster name", "   ", null],
    ["an invalid location", "Gentle Swamp", { ...location, latitude: 91 }],
  ])("rejects %s and stores nothing", async (_case, posterName, invalid) => {
    const poster = await storedPoster();

    await expect(
      service.register(poster.id, posterName, invalid),
    ).rejects.toThrow(ValidationError);
    expect(posters.registrations).toEqual([]);
  });
});
