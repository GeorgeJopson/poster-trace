import "dotenv/config";
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { drizzle } from "drizzle-orm/node-postgres";

import { poster, posterCampaign, posterDesign, scan, user } from "@/db/schema";

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

const db = drizzle({ connection: getLocalConnectionString() });

const posterImagesDir = path.join(process.cwd(), "public/poster-images");
function loadDesignImage(filename: string) {
  return fs.readFileSync(path.join(posterImagesDir, filename));
}

// Scan timestamps relative to now, spread over the last couple of weeks.
function daysAgo(days: number, hour = 12) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, 0, 0, 0);
  return date;
}

// Seeded campaigns belong to this user. Signing in with Google using the
// same email links to it, so the seed data shows up on your dashboard.
async function getSeedUser() {
  const email = process.env.SEED_USER_EMAIL?.toLowerCase();
  if (!email) {
    throw new Error("Set SEED_USER_EMAIL in .env to the account to seed");
  }
  // The no-op update makes RETURNING give back an existing user too.
  const [seedUser] = await db
    .insert(user)
    .values({
      id: crypto.randomUUID(),
      name: email.split("@")[0],
      email,
      emailVerified: true,
    })
    .onConflictDoUpdate({ target: user.email, set: { email } })
    .returning();
  return seedUser;
}

async function main() {
  // Clear existing poster data so the seed is repeatable. Deleting campaigns
  // cascades to their designs, posters and scans.
  await db.delete(posterCampaign);

  const { id: userId } = await getSeedUser();

  const [summerFest] = await db
    .insert(posterCampaign)
    .values({
      name: "Summer Music Festival 2026",
      target: "https://posters.example.com/campaigns/summer-fest-2026",
      userId,
    })
    .returning();

  const [cafeOpening] = await db
    .insert(posterCampaign)
    .values({
      name: "Downtown Cafe Grand Opening",
      target: "https://posters.example.com/campaigns/cafe-opening",
      userId,
    })
    .returning();

  const [marathon] = await db
    .insert(posterCampaign)
    .values({
      name: "City Marathon 2026 Registration",
      target: "https://posters.example.com/campaigns/marathon-2026",
      userId,
    })
    .returning();

  // Newly created campaign: no design or posters exist
  await db.insert(posterCampaign).values({
    name: "Neighborhood Art Walk 2026",
    target: "https://posters.example.com/campaigns/art-walk-2026",
    userId,
  });

  const [summerFestDesignA] = await db
    .insert(posterDesign)
    .values({
      design: loadDesignImage("stock-poster-1.webp"),
      designMimeType: "image/webp",
      qrXPosition: 0.82,
      qrYPosition: 0.85,
      qrSize: 0.12,
      qrRotation: 0,
      posterCampaignId: summerFest.id,
    })
    .returning();

  const [summerFestDesignB] = await db
    .insert(posterDesign)
    .values({
      design: loadDesignImage("stock-poster-2.webp"),
      designMimeType: "image/webp",
      qrXPosition: 0.5,
      qrYPosition: 0.9,
      qrSize: 0.15,
      qrRotation: 5,
      posterCampaignId: summerFest.id,
    })
    .returning();

  const [cafeDesign] = await db
    .insert(posterDesign)
    .values({
      design: loadDesignImage("stock-poster-3.webp"),
      designMimeType: "image/webp",
      qrXPosition: 0.75,
      qrYPosition: 0.8,
      qrSize: 0.1,
      qrRotation: -3,
      posterCampaignId: cafeOpening.id,
    })
    .returning();

  const [marathonDesignA] = await db
    .insert(posterDesign)
    .values({
      design: loadDesignImage("stock-poster-4.webp"),
      designMimeType: "image/webp",
      qrXPosition: 0.2,
      qrYPosition: 0.15,
      qrSize: 0.18,
      qrRotation: 0,
      posterCampaignId: marathon.id,
    })
    .returning();

  const [marathonDesignB] = await db
    .insert(posterDesign)
    .values({
      design: loadDesignImage("stock-poster-5.webp"),
      designMimeType: "image/webp",
      qrXPosition: 0.85,
      qrYPosition: 0.1,
      qrSize: 0.1,
      qrRotation: 90,
      posterCampaignId: marathon.id,
    })
    .returning();

  // Physical posters, placed around San Francisco. Most are activated
  // (already put up); a couple are still pending deployment.
  const [posterA1] = await db
    .insert(poster)
    .values({
      activated: true,
      latitude: 37.7749,
      longitude: -122.4194,
      posterDesignId: summerFestDesignA.id,
    })
    .returning();

  const [posterA2] = await db
    .insert(poster)
    .values({
      activated: true,
      latitude: 37.7849,
      longitude: -122.4094,
      posterDesignId: summerFestDesignA.id,
    })
    .returning();

  await db.insert(poster).values({
    activated: false,
    latitude: 37.8049,
    longitude: -122.4294,
    posterDesignId: summerFestDesignA.id,
  });

  const [posterB1] = await db
    .insert(poster)
    .values({
      activated: true,
      latitude: 37.7649,
      longitude: -122.4394,
      posterDesignId: summerFestDesignB.id,
    })
    .returning();

  const [posterC1] = await db
    .insert(poster)
    .values({
      activated: true,
      latitude: 37.7949,
      longitude: -122.3994,
      posterDesignId: cafeDesign.id,
    })
    .returning();

  const [posterC2] = await db
    .insert(poster)
    .values({
      activated: true,
      latitude: 37.7549,
      longitude: -122.4494,
      posterDesignId: cafeDesign.id,
    })
    .returning();

  await db.insert(poster).values({
    activated: false,
    latitude: 37.8149,
    longitude: -122.4594,
    posterDesignId: marathonDesignA.id,
  });

  const [posterD1] = await db
    .insert(poster)
    .values({
      activated: true,
      latitude: 37.7349,
      longitude: -122.3894,
      posterDesignId: marathonDesignB.id,
    })
    .returning();

  // Scans only make sense for posters that have actually been put up.
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

  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$client.end();
  });
