import { beforeEach, describe, expect, it } from "vitest";

import { RegistrationService } from "@application/services/RegistrationService";
import { PosterDesignId } from "@domain/campaign/design/PosterDesignId";
import { AlreadyRegisteredError } from "@domain/poster/AlreadyRegisteredError";
import { Poster } from "@domain/poster/Poster";
import { PosterId } from "@domain/poster/PosterId";
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
  await posters.addAll([poster]);
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

describe("register's poster name", () => {
  it("is trimmed", async () => {
    const poster = await storedPoster();

    await service.register(poster.id, "  Gentle Swamp \n", null);

    expect(posters.registrations[0].posterName).toBe("Gentle Swamp");
  });

  it.each([
    ["1 character", "a"],
    ["60 characters", "a".repeat(60)],
    ["60 characters once trimmed", ` ${"a".repeat(60)} `],
  ])("may be %s", async (_case, posterName) => {
    const poster = await storedPoster();

    await service.register(poster.id, posterName, null);

    expect(posters.registrations).toHaveLength(1);
  });

  it.each([
    ["empty", ""],
    ["only spaces", "   "],
    ["over 60 characters", "a".repeat(61)],
  ])("is rejected when %s", async (_case, posterName) => {
    const poster = await storedPoster();

    await expect(service.register(poster.id, posterName, null)).rejects.toThrow(
      ValidationError,
    );
    expect(posters.registrations).toEqual([]);
  });
});

describe("register's location", () => {
  it.each([
    ["the edges of the ranges", { latitude: -90, longitude: 180, accuracy: 0 }],
    ["the other edges", { latitude: 90, longitude: -180, accuracy: 10_000 }],
  ])("may be at %s", async (_case, edge) => {
    const poster = await storedPoster();

    await service.register(poster.id, "Gentle Swamp", edge);

    expect(posters.registrations[0].location).toEqual(edge);
  });

  it.each([
    ["latitude below -90", { ...location, latitude: -90.01 }],
    ["latitude above 90", { ...location, latitude: 90.01 }],
    ["longitude below -180", { ...location, longitude: -180.01 }],
    ["longitude above 180", { ...location, longitude: 180.01 }],
    ["negative accuracy", { ...location, accuracy: -1 }],
    ["a NaN latitude", { ...location, latitude: NaN }],
    ["an infinite longitude", { ...location, longitude: -Infinity }],
    ["an infinite accuracy", { ...location, accuracy: Infinity }],
  ])("is rejected with %s", async (_case, invalid) => {
    const poster = await storedPoster();

    await expect(
      service.register(poster.id, "Gentle Swamp", invalid),
    ).rejects.toThrow(ValidationError);
    expect(posters.registrations).toEqual([]);
  });
});
