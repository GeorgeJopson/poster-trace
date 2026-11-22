import "dotenv/config";
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { hashPassword } from "better-auth/crypto";

import { getPosterDesignImageDetails } from "@application/files/getPosterDesignImageDetails";
import { CampaignId } from "@domain/campaign/CampaignId";
import { CampaignTarget } from "@domain/campaign/CampaignTarget";
import { PosterDesignId } from "@domain/campaign/design/PosterDesignId";
import { PosterDesignImage } from "@domain/campaign/design/PosterDesignImage";
import { PosterId } from "@domain/poster/PosterId";
import { PosterName } from "@domain/poster/PosterName";
import { RegistrationLocation } from "@domain/poster/RegistrationLocation";
import {
  QrPlacement,
  type QrPlacementFields,
} from "@domain/campaign/design/QrPlacement";
import {
  account,
  campaign,
  poster,
  posterDesign,
  registration,
  scan,
  user,
} from "@infrastructure/db/schema";
import { NetlifyBlobStore } from "@infrastructure/storage/NetlifyBlobStore";
import { connectToLocalBlobStorage } from "@infrastructure/storage/localDev";

// Seeds the local database started by `netlify dev`, the same one the app
// uses there. Never point this at a Netlify-hosted database: it deletes all
// poster data first.
function getLocalConnectionString() {
  // The CLI prefers NETLIFY_DB_URL if it's set (e.g. from .env), but
  // `netlify dev` ignores it, so drop it to match what the app sees.
  const env = { ...process.env };
  delete env.NETLIFY_DB_URL;
  const output = execFileSync("netlify", ["database", "connect", "--json"], {
    encoding: "utf8",
    env,
  });
  return JSON.parse(output).connection_string as string;
}

// Its own connection rather than the app's getDb(), which reads
// NETLIFY_DB_URL and so could point at a hosted database.
const db = drizzle({ connection: getLocalConnectionString() });
// The same sandboxed local store `netlify dev` serves images from. It sets the
// Blobs environment, so the store is only used once it's connected.
const blobStorage = connectToLocalBlobStorage();
let blobStore: NetlifyBlobStore;

// A4 PDF versions of public/poster-images, as designs must be A4 PDFs.
const posterImagesDir = path.join(process.cwd(), "scripts/seed-images");
async function uploadDesignImage(filename: string) {
  const data = new Blob([
    fs.readFileSync(path.join(posterImagesDir, filename)),
  ]);
  // Checked as an upload is, so a seed file that isn't a valid design fails
  // here rather than when a page loads it.
  const image = PosterDesignImage.create(
    data,
    await getPosterDesignImageDetails(data),
  );
  // The store doesn't assign keys, so generate one, as the app does.
  const key = crypto.randomUUID();
  await blobStore.set(key, image.data, image.contentType);
  return key;
}

// Ids come from the domain, and values go through its factories, so an invalid
// seeded value fails here rather than when a page loads it.

// Rows are ordered by created_at, so each seeded row is given its own. A
// campaign's scans over time start on the day it was created, so campaigns
// with scans are created before their first scan. Without a createdAt the
// database sets it to now, with a pause first so quick inserts keep their
// order.
async function insertCampaign(
  userId: string,
  name: string,
  target: string,
  createdAt?: Date,
) {
  const id = CampaignId.generate();
  if (!createdAt) await pause();
  await db.insert(campaign).values({
    id,
    name,
    target: CampaignTarget.create(target).value,
    userId,
    createdAt,
  });
  return id;
}

// The designs are portrait A4, and `size` is a percentage of the design's
// width, so every QR code fits on its design.
async function insertDesign(
  campaignId: CampaignId,
  filename: string,
  fields: QrPlacementFields,
  createdAt: Date,
) {
  const id = PosterDesignId.generate();
  const { x, y, size, rotation } = QrPlacement.create(fields);
  const designImageKey = await uploadDesignImage(filename);
  await db.insert(posterDesign).values({
    id,
    designImageKey,
    x,
    y,
    size,
    rotation,
    campaignId,
    createdAt,
  });
  return id;
}

// Seeded timestamps relative to now, spread over the last couple of weeks.
function daysAgo(days: number, hour = 12, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, minute, 0, 0);
  return date;
}

function pause() {
  return new Promise((resolve) => setTimeout(resolve, 10));
}

// Seeded campaigns belong to this test account. Log in with these
// credentials to see the seed data on the dashboard.
const SEED_USER_EMAIL = "test@example.com";
const SEED_USER_PASSWORD = "password123";

async function getSeedUser() {
  // The no-op update makes RETURNING give back an existing user too.
  const [seedUser] = await db
    .insert(user)
    .values({
      id: crypto.randomUUID(),
      name: "Test User",
      email: SEED_USER_EMAIL,
      emailVerified: true,
    })
    .onConflictDoUpdate({ target: user.email, set: { email: SEED_USER_EMAIL } })
    .returning();

  // Better Auth stores email/password sign-in as a "credential" account whose
  // accountId is the user's ID. Replace it so the password is always reset.
  await db
    .delete(account)
    .where(
      and(
        eq(account.userId, seedUser.id),
        eq(account.providerId, "credential"),
      ),
    );
  await db.insert(account).values({
    id: crypto.randomUUID(),
    accountId: seedUser.id,
    providerId: "credential",
    userId: seedUser.id,
    password: await hashPassword(SEED_USER_PASSWORD),
  });

  return seedUser;
}

async function main() {
  await blobStorage;
  blobStore = NetlifyBlobStore.forPosterDesigns();

  // Clear existing poster data so the seed is repeatable. Deleting campaigns
  // cascades to their designs, posters and scans, so delete the designs'
  // images first.
  const oldDesigns = await db
    .select({ designImageKey: posterDesign.designImageKey })
    .from(posterDesign);
  await Promise.all(
    oldDesigns.map(({ designImageKey }) => blobStore.delete(designImageKey)),
  );
  await db.delete(campaign);

  const { id: userId } = await getSeedUser();

  const summerFest = await insertCampaign(
    userId,
    "Summer Music Festival 2026",
    "https://posters.example.com/campaigns/summer-fest-2026",
    daysAgo(16, 9),
  );
  const cafeOpening = await insertCampaign(
    userId,
    "Downtown Cafe Grand Opening",
    "https://posters.example.com/campaigns/cafe-opening",
    daysAgo(16, 10),
  );
  const marathon = await insertCampaign(
    userId,
    "City Marathon 2026 Registration",
    "https://posters.example.com/campaigns/marathon-2026",
    daysAgo(16, 11),
  );
  // Newly created campaign, created now: no design or posters exist
  await insertCampaign(
    userId,
    "Neighborhood Art Walk 2026",
    "https://posters.example.com/campaigns/art-walk-2026",
  );

  const summerFestDesignA = await insertDesign(
    summerFest,
    "stock-poster-1.pdf",
    { x: 82, y: 85, size: 12, rotation: 0 },
    daysAgo(16, 13),
  );
  const summerFestDesignB = await insertDesign(
    summerFest,
    "stock-poster-2.pdf",
    { x: 50, y: 85, size: 15, rotation: 5 },
    daysAgo(16, 14),
  );
  const cafeDesign = await insertDesign(
    cafeOpening,
    "stock-poster-3.pdf",
    { x: 75, y: 80, size: 10, rotation: 357 },
    daysAgo(16, 15),
  );
  const marathonDesignA = await insertDesign(
    marathon,
    "stock-poster-4.pdf",
    { x: 20, y: 15, size: 18, rotation: 0 },
    daysAgo(16, 16),
  );
  const marathonDesignB = await insertDesign(
    marathon,
    "stock-poster-5.pdf",
    { x: 85, y: 10, size: 10, rotation: 90 },
    daysAgo(16, 17),
  );

  // Generated posters. Some are registered below, and some of those with
  // where they were put up. They're generated a minute apart, before the
  // first registration.
  let posterCount = 0;
  const insertPoster = async (posterDesignId: PosterDesignId) => {
    const [row] = await db
      .insert(poster)
      .values({
        id: PosterId.generate(),
        posterDesignId,
        createdAt: daysAgo(15, 9, posterCount++),
      })
      .returning();
    return row;
  };
  const posterA1 = await insertPoster(summerFestDesignA);
  const posterA2 = await insertPoster(summerFestDesignA);
  const posterA3 = await insertPoster(summerFestDesignA);
  const posterB1 = await insertPoster(summerFestDesignB);
  const posterC1 = await insertPoster(cafeDesign);
  const posterC2 = await insertPoster(cafeDesign);
  await insertPoster(marathonDesignA);
  const posterD1 = await insertPoster(marathonDesignB);

  // Registrations, made before each poster's first scan. Locations are around
  // the University of York campus. Every Summer Music Festival poster is
  // registered; the other campaigns have a mix of registered, located and
  // unregistered posters.
  const insertRegistration = async (
    posterId: string,
    posterName: string,
    registeredAt: Date,
    location: { latitude: number; longitude: number; accuracy: number } | null,
  ) => {
    const checkedLocation = location && RegistrationLocation.create(location);
    await db.insert(registration).values({
      posterId,
      posterName: PosterName.create(posterName).value,
      registeredAt,
      latitude: checkedLocation?.latitude ?? null,
      longitude: checkedLocation?.longitude ?? null,
      accuracy: checkedLocation?.accuracy ?? null,
    });
  };
  await insertRegistration(posterA1.id, "Central Hall", daysAgo(15, 10), {
    latitude: 53.94693,
    longitude: -1.05256,
    accuracy: 8,
  });
  await insertRegistration(posterA2.id, "Library entrance", daysAgo(15, 11), {
    latitude: 53.94868,
    longitude: -1.05177,
    accuracy: 12,
  });
  await insertRegistration(posterA3.id, "Ron Cooke Hub", daysAgo(13, 14), {
    latitude: 53.94867,
    longitude: -1.03063,
    accuracy: 15,
  });
  await insertRegistration(posterB1.id, "Vanbrugh College", daysAgo(8, 9), {
    latitude: 53.94651,
    longitude: -1.05453,
    accuracy: 10,
  });
  await insertRegistration(posterC1.id, "Derwent College", daysAgo(15, 16), {
    latitude: 53.94786,
    longitude: -1.04903,
    accuracy: 20,
  });
  // Registered without a location.
  await insertRegistration(
    posterD1.id,
    "York Sport Centre",
    daysAgo(9, 12),
    null,
  );

  const scans = [
    { posterId: posterA1.id, scannedAt: daysAgo(12, 9) },
    { posterId: posterA1.id, scannedAt: daysAgo(9, 18) },
    { posterId: posterA1.id, scannedAt: daysAgo(4, 13) },
    { posterId: posterA1.id, scannedAt: daysAgo(1, 20) },

    { posterId: posterA2.id, scannedAt: daysAgo(10, 11) },
    { posterId: posterA2.id, scannedAt: daysAgo(3, 17) },

    { posterId: posterB1.id, scannedAt: daysAgo(7, 15) },
    { posterId: posterB1.id, scannedAt: daysAgo(2, 21) },
    { posterId: posterB1.id, scannedAt: daysAgo(0, 10) },

    { posterId: posterC1.id, scannedAt: daysAgo(14, 8) },
    { posterId: posterC1.id, scannedAt: daysAgo(6, 12) },

    { posterId: posterC2.id, scannedAt: daysAgo(5, 19) },

    { posterId: posterD1.id, scannedAt: daysAgo(8, 7) },
    { posterId: posterD1.id, scannedAt: daysAgo(1, 16) },
  ];
  await db
    .insert(scan)
    .values(scans.map((values) => ({ id: crypto.randomUUID(), ...values })));

  console.log(
    `Seed complete. Log in as ${SEED_USER_EMAIL} / ${SEED_USER_PASSWORD}.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$client.end();
    const stopBlobStorage = await blobStorage;
    await stopBlobStorage();
  });
