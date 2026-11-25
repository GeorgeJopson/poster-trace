import { eq, sql } from "drizzle-orm";

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

  async save(posters: Poster | readonly Poster[]): Promise<void> {
    const all = posters instanceof Poster ? [posters] : posters;
    if (all.length === 0) return;
    // One transaction, so it's all or nothing (ADR-0018).
    await this.db.transaction(async (tx) => {
      await tx
        .insert(posterTable)
        .values(
          all.map(({ id, designId }) => ({ id, posterDesignId: designId })),
        )
        .onConflictDoUpdate({
          target: posterTable.id,
          set: { posterDesignId: sql`excluded.poster_design_id` },
        });

      // A stored registration missing from the poster is never deleted, and
      // the last one saved wins (ADR-0018).
      const registrations = all.flatMap(({ id, registration }) =>
        registration
          ? [
              {
                posterId: id,
                posterName: registration.posterName.value,
                registeredAt: registration.registeredAt,
                latitude: registration.location?.latitude ?? null,
                longitude: registration.location?.longitude ?? null,
              },
            ]
          : [],
      );
      if (registrations.length === 0) return;
      await tx
        .insert(registrationTable)
        .values(registrations)
        .onConflictDoUpdate({
          target: registrationTable.posterId,
          set: {
            posterName: sql`excluded.poster_name`,
            registeredAt: sql`excluded.registered_at`,
            latitude: sql`excluded.latitude`,
            longitude: sql`excluded.longitude`,
          },
        });
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
      const { posterName, registeredAt, latitude, longitude } =
        row.registration;
      // Through the validating factories (ADR-0006). The table's check keeps
      // the location columns all set or all null.
      const location =
        latitude !== null && longitude !== null
          ? RegistrationLocation.create({ latitude, longitude })
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
