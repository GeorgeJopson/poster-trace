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

  save(poster: Poster): Promise<void>;
  save(posters: readonly Poster[]): Promise<void>;
  async save(posterOrPosters: Poster | readonly Poster[]): Promise<void> {
    const posters =
      posterOrPosters instanceof Poster ? [posterOrPosters] : posterOrPosters;
    // Checked before anything is written, so it's all or none like the
    // Drizzle repository's transaction.
    const newPosters: InMemoryPosterRepository["posters"] = [];
    const newRegistrations: InMemoryPosterRepository["registrations"] = [];
    for (const { id, designId, registration } of posters) {
      // Nothing is written over a stored poster or registration (ADR-0018).
      if (!this.has(id)) newPosters.push({ id, designId });
      if (!registration) continue;
      const { posterName, registeredAt, location } = registration;
      const row = {
        posterId: id,
        posterName: posterName.value,
        registeredAt,
        location: location && {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
        },
      };
      const stored = this.registrations.find(({ posterId }) => posterId === id);
      if (!stored) newRegistrations.push(row);
      // Saving the same registration again is fine; someone else's stored
      // since the poster was loaded is a conflict (ADR-0018).
      else if (!isSameRegistration(stored, row)) {
        throw new AlreadyRegisteredError();
      }
    }
    this.posters.push(...newPosters);
    this.registrations.push(...newRegistrations);
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

type RegistrationRow = InMemoryPosterRepository["registrations"][number];

function isSameRegistration(a: RegistrationRow, b: RegistrationRow): boolean {
  return (
    a.posterName === b.posterName &&
    a.registeredAt.getTime() === b.registeredAt.getTime() &&
    a.location?.latitude === b.location?.latitude &&
    a.location?.longitude === b.location?.longitude &&
    a.location?.accuracy === b.location?.accuracy
  );
}
