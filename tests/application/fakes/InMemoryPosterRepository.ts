import type { PosterDesignId } from "@domain/campaign/design/PosterDesignId";
import { Poster } from "@domain/poster/Poster";
import type { PosterId } from "@domain/poster/PosterId";
import { PosterName } from "@domain/poster/PosterName";
import type { PosterRepository } from "@domain/poster/PosterRepository";
import type { Registration } from "@domain/poster/Registration";
import { RegistrationLocation } from "@domain/poster/RegistrationLocation";

/** Behaves like DrizzlePosterRepository, storing copies of the posters. */
export class InMemoryPosterRepository implements PosterRepository {
  // In insertion order, like ordering by created_at.
  readonly posters: { id: PosterId; designId: PosterDesignId }[] = [];
  // Plain values, like the registration table's columns.
  readonly registrations: {
    posterId: PosterId;
    posterName: string;
    registeredAt: Date;
    location: { latitude: number; longitude: number } | null;
  }[] = [];

  /** Whether the poster is stored, like the tables' foreign keys check. */
  has(id: PosterId): boolean {
    return this.posters.some((poster) => poster.id === id);
  }

  async save(posters: Poster | readonly Poster[]): Promise<void> {
    const all = posters instanceof Poster ? [posters] : posters;
    for (const { id, designId, registration } of all) {
      const stored = this.posters.find((poster) => poster.id === id);
      if (stored) stored.designId = designId;
      else this.posters.push({ id, designId });

      // Never deleted, and the last one saved wins, like the upsert.
      if (!registration) continue;
      const { posterName, registeredAt, location } = registration;
      const row = {
        posterId: id,
        posterName: posterName.value,
        registeredAt,
        location: location && {
          latitude: location.latitude,
          longitude: location.longitude,
        },
      };
      const index = this.registrations.findIndex(
        ({ posterId }) => posterId === id,
      );
      if (index === -1) this.registrations.push(row);
      else this.registrations[index] = row;
    }
  }

  async findById(id: PosterId): Promise<Poster | null> {
    const stored = this.posters.find((poster) => poster.id === id);
    if (!stored) return null;
    const storedRegistration = this.registrations.find(
      ({ posterId }) => posterId === id,
    );
    let registration: Registration | null = null;
    if (storedRegistration) {
      // Through the validating factories, like DrizzlePosterRepository.
      const { posterName, registeredAt, location } = storedRegistration;
      registration = {
        posterName: PosterName.create(posterName),
        registeredAt,
        location: location && RegistrationLocation.create(location),
      };
    }
    return Poster.restore({ ...stored, registration });
  }
}
