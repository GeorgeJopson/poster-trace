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
    location: { latitude: number; longitude: number; accuracy: number } | null;
  }[] = [];

  /** Whether the poster is stored, like the tables' foreign keys check. */
  has(id: PosterId): boolean {
    return this.posters.some((poster) => poster.id === id);
  }

  save(poster: Poster): Promise<void>;
  save(posters: readonly Poster[]): Promise<void>;
  async save(posterOrPosters: Poster | readonly Poster[]): Promise<void> {
    const posters =
      posterOrPosters instanceof Poster ? [posterOrPosters] : posterOrPosters;
    for (const { id, designId, registration } of posters) {
      // Nothing is written over a stored poster or registration, like the
      // Drizzle repository's ON CONFLICT DO NOTHING (ADR-0018).
      if (!this.has(id)) this.posters.push({ id, designId });
      if (!registration || this.isRegistered(id)) continue;
      const { posterName, registeredAt, location } = registration;
      this.registrations.push({
        posterId: id,
        posterName: posterName.value,
        registeredAt,
        location: location && {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
        },
      });
    }
  }

  private isRegistered(id: PosterId): boolean {
    return this.registrations.some(({ posterId }) => posterId === id);
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
