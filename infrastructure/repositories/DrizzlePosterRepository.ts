import { eq } from "drizzle-orm";

import { PosterDesignId } from "@domain/campaign/design/PosterDesignId";
import { AlreadyRegisteredError } from "@domain/poster/AlreadyRegisteredError";
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
  scan as scanTable,
} from "../db/schema";

/** Postgres's error code for a unique or primary key violation. */
const UNIQUE_VIOLATION = "23505";

/** Whether `error`, or the driver error Drizzle wrapped in it, has `code`. */
function hasPgCode(error: unknown, code: string): boolean {
  for (
    let e = error;
    e instanceof Object;
    e = (e as { cause?: unknown }).cause
  ) {
    if ((e as { code?: unknown }).code === code) return true;
  }
  return false;
}

export class DrizzlePosterRepository implements PosterRepository {
  constructor(private readonly db: Db) {}

  async addAll(posters: readonly Poster[]): Promise<void> {
    if (posters.length === 0) return;
    // One INSERT, so it's all or nothing.
    await this.db.insert(posterTable).values(
      posters.map((poster) => ({
        id: poster.id,
        posterDesignId: poster.designId,
      })),
    );
  }

  async findById(id: PosterId): Promise<Poster | null> {
    // A poster's stored scans are never loaded (see ADR-0015), but its
    // registration is, as there's at most one (see ADR-0016).
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

  async addNewScans(poster: Poster): Promise<void> {
    if (poster.newScans.length === 0) return;
    // One INSERT, so it's all or nothing.
    await this.db.insert(scanTable).values(
      poster.newScans.map((scan) => ({
        id: scan.id,
        posterId: poster.id,
        scannedAt: scan.scannedAt,
      })),
    );
  }

  async addRegistration(poster: Poster): Promise<void> {
    const { registration } = poster;
    if (!registration) return;
    try {
      await this.db.insert(registrationTable).values({
        posterId: poster.id,
        posterName: registration.posterName.value,
        registeredAt: registration.registeredAt,
        latitude: registration.location?.latitude ?? null,
        longitude: registration.location?.longitude ?? null,
        accuracy: registration.location?.accuracy ?? null,
      });
    } catch (error) {
      // The table is keyed by poster id, so this is someone else's
      // registration of the poster, stored since it was loaded (ADR-0016).
      if (hasPgCode(error, UNIQUE_VIOLATION)) {
        throw new AlreadyRegisteredError();
      }
      throw error;
    }
  }
}
