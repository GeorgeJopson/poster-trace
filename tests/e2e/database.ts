import { execFileSync } from "node:child_process";
import { drizzle } from "drizzle-orm/node-postgres";

import { sql } from "drizzle-orm";

import { registration } from "@infrastructure/db/schema";

// Registering a poster in the browser needs a camera to read its QR code, so
// tests that only need registered posters store them in the local database
// `netlify dev` serves, the same one scripts/seed.ts connects to.
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

/**
 * Stores `target` as the target of the campaign the poster with the scan URL
 * path belongs to, bypassing validation, as if it had been stored before the
 * rules on targets changed.
 */
export async function storeCampaignTarget(scanPath: string, target: string) {
  db ??= drizzle({ connection: getLocalConnectionString() });
  const posterId = scanPath.split("/").at(-1)!;
  await db.execute(sql`
    update campaign set target = ${target}
    where id = (
      select poster_design.campaign_id
      from poster
      join poster_design on poster_design.id = poster.poster_design_id
      where poster.id = ${posterId}
    )`);
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
  db ??= drizzle({ connection: getLocalConnectionString() });
  await db.insert(registration).values({
    posterId: scanPath.split("/").at(-1)!,
    posterName,
    registeredAt: new Date(),
    ...(location && { ...location, accuracy: 10 }),
  });
}
