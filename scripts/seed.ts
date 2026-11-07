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
import { PosterDesignImageUpload } from "@domain/campaign/design/PosterDesignImageUpload";
import { PosterId } from "@domain/poster/PosterId";
import {
  QrPlacement,
  type QrPlacementFields,
} from "@domain/campaign/design/QrPlacement";
import {
  account,
  campaign,
  poster,
  posterDesign,
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
  const image = PosterDesignImageUpload.create(
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

async function insertCampaign(userId: string, name: string, target: string) {
  const id = CampaignId.generate();
  await db.insert(campaign).values({
    id,
    name,
    target: CampaignTarget.create(target).value,
    userId,
  });
  return id;
}

// The designs are portrait A4, and `size` is a percentage of the design's
// width, so every QR code fits on its design.
async function insertDesign(
  campaignId: CampaignId,
  filename: string,
  fields: QrPlacementFields,
) {
  const id = PosterDesignId.generate();
  const { x, y, size, rotation } = QrPlacement.create(fields);
  await db.insert(posterDesign).values({
    id,
    designImageKey: await uploadDesignImage(filename),
    x,
    y,
    size,
    rotation,
    campaignId,
  });
  return id;
}

// Scan timestamps relative to now, spread over the last couple of weeks.
function daysAgo(days: number, hour = 12) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, 0, 0, 0);
  return date;
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
  blobStore = new NetlifyBlobStore(
    NetlifyBlobStore.POSTER_DESIGN_STORE,
    NetlifyBlobStore.deletesAllowedIn(process.env.NETLIFY_CONTEXT),
  );

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
  );
  const cafeOpening = await insertCampaign(
    userId,
    "Downtown Cafe Grand Opening",
    "https://posters.example.com/campaigns/cafe-opening",
  );
  const marathon = await insertCampaign(
    userId,
    "City Marathon 2026 Registration",
    "https://posters.example.com/campaigns/marathon-2026",
  );
  // Newly created campaign: no design or posters exist
  await insertCampaign(
    userId,
    "Neighborhood Art Walk 2026",
    "https://posters.example.com/campaigns/art-walk-2026",
  );

  const summerFestDesignA = await insertDesign(
    summerFest,
    "stock-poster-1.pdf",
    { x: 82, y: 85, size: 12, rotation: 0 },
  );
  const summerFestDesignB = await insertDesign(
    summerFest,
    "stock-poster-2.pdf",
    { x: 50, y: 85, size: 15, rotation: 5 },
  );
  const cafeDesign = await insertDesign(cafeOpening, "stock-poster-3.pdf", {
    x: 75,
    y: 80,
    size: 10,
    rotation: 357,
  });
  const marathonDesignA = await insertDesign(marathon, "stock-poster-4.pdf", {
    x: 20,
    y: 15,
    size: 18,
    rotation: 0,
  });
  const marathonDesignB = await insertDesign(marathon, "stock-poster-5.pdf", {
    x: 85,
    y: 10,
    size: 10,
    rotation: 90,
  });

  // Generated posters. Registrations (where each was put up) aren't built
  // yet, so the scans below are for posters with no recorded location.
  const insertPoster = async (posterDesignId: PosterDesignId) => {
    const [row] = await db
      .insert(poster)
      .values({ id: PosterId.generate(), posterDesignId })
      .returning();
    return row;
  };
  const posterA1 = await insertPoster(summerFestDesignA);
  const posterA2 = await insertPoster(summerFestDesignA);
  await insertPoster(summerFestDesignA);
  const posterB1 = await insertPoster(summerFestDesignB);
  const posterC1 = await insertPoster(cafeDesign);
  const posterC2 = await insertPoster(cafeDesign);
  await insertPoster(marathonDesignA);
  const posterD1 = await insertPoster(marathonDesignB);

  await db.insert(scan).values([
    { posterId: posterA1.id, time: daysAgo(12, 9) },
    { posterId: posterA1.id, time: daysAgo(9, 18) },
    { posterId: posterA1.id, time: daysAgo(4, 13) },
    { posterId: posterA1.id, time: daysAgo(1, 20) },

    { posterId: posterA2.id, time: daysAgo(10, 11) },
    { posterId: posterA2.id, time: daysAgo(3, 17) },

    { posterId: posterB1.id, time: daysAgo(7, 15) },
    { posterId: posterB1.id, time: daysAgo(2, 21) },
    { posterId: posterB1.id, time: daysAgo(0, 10) },

    { posterId: posterC1.id, time: daysAgo(14, 8) },
    { posterId: posterC1.id, time: daysAgo(6, 12) },

    { posterId: posterC2.id, time: daysAgo(5, 19) },

    { posterId: posterD1.id, time: daysAgo(8, 7) },
    { posterId: posterD1.id, time: daysAgo(1, 16) },
  ]);

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
