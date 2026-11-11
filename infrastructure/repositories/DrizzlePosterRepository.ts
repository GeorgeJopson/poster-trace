import { eq } from "drizzle-orm";

import { PosterDesignId } from "@domain/campaign/design/PosterDesignId";
import { Poster } from "@domain/poster/Poster";
import { PosterId } from "@domain/poster/PosterId";
import { PosterName } from "@domain/poster/PosterName";
import type { PosterRepository } from "@domain/poster/PosterRepository";
import type { Registration } from "@domain/poster/Registration";
import { RegistrationLocation } from "@domain/poster/RegistrationLocation";

import type { Db } from "../db/client";
import {
  poster as posterTable,
  registration as registrationTable,
} from "../db/schema";

export class DrizzlePosterRepository implements PosterRepository {
  constructor(private readonly db: Db) {}

  save(poster: Poster): Promise<void>;
  save(posters: readonly Poster[]): Promise<void>;
  async save(posterOrPosters: Poster | readonly Poster[]): Promise<void> {
    const posters =
      posterOrPosters instanceof Poster ? [posterOrPosters] : posterOrPosters;
    if (posters.length === 0) return;
    const registrations = posters.flatMap(({ id, registration }) =>
      registration
        ? [
            {
              posterId: id,
              posterName: registration.posterName.value,
              registeredAt: registration.registeredAt,
              latitude: registration.location?.latitude ?? null,
              longitude: registration.location?.longitude ?? null,
              accuracy: registration.location?.accuracy ?? null,
            },
          ]
        : [],
    );
    await this.db.transaction(async (tx) => {
      // Nothing on a stored poster's row changes.
      await tx
        .insert(posterTable)
        .values(
          posters.map((poster) => ({
            id: poster.id,
            posterDesignId: poster.designId,
          })),
        )
        .onConflictDoNothing({ target: posterTable.id });
      if (registrations.length === 0) return;
      // The first stored registration wins and is never overwritten, even by
      // someone who registered the poster at the same moment (ADR-0018).
      await tx
        .insert(registrationTable)
        .values(registrations)
        .onConflictDoNothing({ target: registrationTable.posterId });
    });
  }

  async findById(id: PosterId): Promise<Poster | null> {
    // Its registration is loaded, as there's at most one (see ADR-0016).
    const [row] = await this.db
      .select({
        id: posterTable.id,
        designId: posterTable.posterDesignId,
        registration: registrationTable,
      })
      .from(posterTable)
      .leftJoin(
        registrationTable,
        eq(registrationTable.posterId, posterTable.id),
      )
      .where(eq(posterTable.id, id))
      .limit(1);
    if (!row) return null;

    let registration: Registration | null = null;
    if (row.registration) {
      const { posterName, registeredAt, latitude, longitude, accuracy } =
        row.registration;
      // Through the validating factories (ADR-0006). The table's check keeps
      // the location columns all set or all null.
      const location =
        latitude !== null && longitude !== null && accuracy !== null
          ? RegistrationLocation.create({ latitude, longitude, accuracy })
          : null;
      registration = {
        posterName: PosterName.create(posterName),
        registeredAt,
        location,
      };
    }
    return Poster.restore({
      id: PosterId.from(row.id),
      designId: PosterDesignId.from(row.designId),
      registration,
    });
  }
}
