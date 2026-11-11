import type { PosterDesignId } from "@domain/campaign/design/PosterDesignId";
import { AlreadyRegisteredError } from "@domain/poster/AlreadyRegisteredError";
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

  async addAll(posters: readonly Poster[]): Promise<void> {
    this.posters.push(...posters.map(({ id, designId }) => ({ id, designId })));
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

  async addRegistration(poster: Poster): Promise<void> {
    const { registration } = poster;
    if (!registration) return;
    if (!this.has(poster.id)) {
      // Like the registration table's foreign key.
      throw new Error(`No poster ${poster.id}`);
    }
    // Keyed by poster id, so a second registration fails like the primary
    // key would.
    if (this.registrations.some(({ posterId }) => posterId === poster.id)) {
      throw new AlreadyRegisteredError();
    }
    const { posterName, registeredAt, location } = registration;
    this.registrations.push({
      posterId: poster.id,
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
