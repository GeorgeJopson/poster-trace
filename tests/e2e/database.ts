import { execFileSync } from "node:child_process";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";

import { posterDesign, registration } from "@infrastructure/db/schema";

// Tests reach the local database `netlify dev` serves, the same one
// scripts/seed.ts connects to, for what the browser can't do or see.
function getLocalConnectionString() {
  // `netlify dev` ignores NETLIFY_DB_URL, so drop it to match what the app sees.
  const env = { ...process.env };
  delete env.NETLIFY_DB_URL;
  const output = execFileSync("netlify", ["database", "connect", "--json"], {
    encoding: "utf8",
    env,
  });
  return JSON.parse(output).connection_string as string;
}

let db: ReturnType<typeof drizzle> | undefined;

function localDb() {
  db ??= drizzle({ connection: getLocalConnectionString() });
  return db;
}

/**
 * Registers the poster with the scan URL path, at `location` if one is given,
 * as if someone had registered it on the register page.
 */
export async function registerPoster(
  scanPath: string,
  posterName: string,
  location: { latitude: number; longitude: number } | null = null,
) {
  // Registering a poster in the browser needs a camera to read its QR code.
  await localDb()
    .insert(registration)
    .values({
      posterId: scanPath.split("/").at(-1)!,
      posterName,
      registeredAt: new Date(),
      ...location,
    });
}

/** The QR placements saved for the campaign's poster designs. */
export async function savedQrPlacements(campaignId: string) {
  return localDb()
    .select({
      x: posterDesign.x,
      y: posterDesign.y,
      size: posterDesign.size,
      rotation: posterDesign.rotation,
    })
    .from(posterDesign)
    .where(eq(posterDesign.campaignId, campaignId));
}
