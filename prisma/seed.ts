import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

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
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      id: crypto.randomUUID(),
      name: email.split("@")[0],
      email,
      emailVerified: true,
    },
  });
}

async function main() {
  // Clear existing poster data (children first) so the seed is repeatable.
  await prisma.scan.deleteMany();
  await prisma.poster.deleteMany();
  await prisma.posterDesign.deleteMany();
  await prisma.posterCampaign.deleteMany();

  const { id: userId } = await getSeedUser();

  const summerFest = await prisma.posterCampaign.create({
    data: {
      name: "Summer Music Festival 2026",
      target: "https://posters.example.com/campaigns/summer-fest-2026",
      userId,
    },
  });

  const cafeOpening = await prisma.posterCampaign.create({
    data: {
      name: "Downtown Cafe Grand Opening",
      target: "https://posters.example.com/campaigns/cafe-opening",
      userId,
    },
  });

  const marathon = await prisma.posterCampaign.create({
    data: {
      name: "City Marathon 2026 Registration",
      target: "https://posters.example.com/campaigns/marathon-2026",
      userId,
    },
  });

  // Newly created campaign: no design or posters exist
  await prisma.posterCampaign.create({
    data: {
      name: "Neighborhood Art Walk 2026",
      target: "https://posters.example.com/campaigns/art-walk-2026",
      userId,
    },
  });

  const summerFestDesignA = await prisma.posterDesign.create({
    data: {
      design: loadDesignImage("stock-poster-1.jpg"),
      designMimeType: "image/jpeg",
      qr_x_position: 0.82,
      qr_y_position: 0.85,
      qr_size: 0.12,
      qr_rotation: 0,
      posterCampaignId: summerFest.id,
    },
  });

  const summerFestDesignB = await prisma.posterDesign.create({
    data: {
      design: loadDesignImage("stock-poster-2.jpg"),
      designMimeType: "image/jpeg",
      qr_x_position: 0.5,
      qr_y_position: 0.9,
      qr_size: 0.15,
      qr_rotation: 5,
      posterCampaignId: summerFest.id,
    },
  });

  const cafeDesign = await prisma.posterDesign.create({
    data: {
      design: loadDesignImage("stock-poster-3.jpg"),
      designMimeType: "image/jpeg",
      qr_x_position: 0.75,
      qr_y_position: 0.8,
      qr_size: 0.1,
      qr_rotation: -3,
      posterCampaignId: cafeOpening.id,
    },
  });

  const marathonDesignA = await prisma.posterDesign.create({
    data: {
      design: loadDesignImage("stock-poster-4.jpg"),
      designMimeType: "image/jpeg",
      qr_x_position: 0.2,
      qr_y_position: 0.15,
      qr_size: 0.18,
      qr_rotation: 0,
      posterCampaignId: marathon.id,
    },
  });

  const marathonDesignB = await prisma.posterDesign.create({
    data: {
      design: loadDesignImage("stock-poster-5.jpg"),
      designMimeType: "image/jpeg",
      qr_x_position: 0.85,
      qr_y_position: 0.1,
      qr_size: 0.1,
      qr_rotation: 90,
      posterCampaignId: marathon.id,
    },
  });

  // Physical posters, placed around San Francisco. Most are activated
  // (already put up); a couple are still pending deployment.
  const posterA1 = await prisma.poster.create({
    data: {
      activated: true,
      latitude: 37.7749,
      longitude: -122.4194,
      posterDesignId: summerFestDesignA.id,
    },
  });

  const posterA2 = await prisma.poster.create({
    data: {
      activated: true,
      latitude: 37.7849,
      longitude: -122.4094,
      posterDesignId: summerFestDesignA.id,
    },
  });

  await prisma.poster.create({
    data: {
      activated: false,
      latitude: 37.8049,
      longitude: -122.4294,
      posterDesignId: summerFestDesignA.id,
    },
  });

  const posterB1 = await prisma.poster.create({
    data: {
      activated: true,
      latitude: 37.7649,
      longitude: -122.4394,
      posterDesignId: summerFestDesignB.id,
    },
  });

  const posterC1 = await prisma.poster.create({
    data: {
      activated: true,
      latitude: 37.7949,
      longitude: -122.3994,
      posterDesignId: cafeDesign.id,
    },
  });

  const posterC2 = await prisma.poster.create({
    data: {
      activated: true,
      latitude: 37.7549,
      longitude: -122.4494,
      posterDesignId: cafeDesign.id,
    },
  });

  await prisma.poster.create({
    data: {
      activated: false,
      latitude: 37.8149,
      longitude: -122.4594,
      posterDesignId: marathonDesignA.id,
    },
  });

  const posterD1 = await prisma.poster.create({
    data: {
      activated: true,
      latitude: 37.7349,
      longitude: -122.3894,
      posterDesignId: marathonDesignB.id,
    },
  });

  // Scans only make sense for posters that have actually been put up.
  await prisma.scan.createMany({
    data: [
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
    ],
  });

  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
