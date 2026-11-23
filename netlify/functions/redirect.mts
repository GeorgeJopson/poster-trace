import { neon } from "@neondatabase/serverless";

import { scanTargetStore } from "../../infrastructure/storage/scanTargetStore";

// Where every poster's QR code points (ADR-0014). A Netlify Function rather
// than a Next route, so a scan never waits for the Next server to start, and
// kept warm by warm-up-redirect.mts. It reads each poster's target from a
// copy in Netlify Blobs, so a scan needn't wait for the database to wake up,
// and only queries the database for a poster that isn't there (ADR-0020).
//
// It handles scans itself, outside the layers (ADR-0019): it can't load the
// services, which are "server-only", and staying out of them keeps the
// bundle, and so every cold start, small. Keep in step:
// - UUID_PATTERN with isUuid (domain/shared/uuid.ts)
// - POSTER_NOT_FOUND_PATH with src/app/(public)/poster-not-found
// - WARM_UP_HEADER with its copy in warm-up-redirect.mts
// Anyone can scan a poster, so there's no session check.

/** The parts of Netlify's function context this uses. */
export interface RedirectContext {
  params: Record<string, string | undefined>;
  deploy?: { context?: string };
  waitUntil(promise: Promise<unknown>): void;
}

// A UUID in its canonical, lower-case form, like isUuid in the domain.
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// Postgres's error code for a foreign key violation.
const FOREIGN_KEY_VIOLATION = "23503";

const POSTER_NOT_FOUND_PATH = "/poster-not-found";

// The header warm-up-redirect.mts sends to keep this function's Lambda warm.
const WARM_UP_HEADER = "X-Warm-Up";

// The headers a deploy preview's access protection checks: its password or
// SSO session cookie, or basic auth.
const ACCESS_HEADERS = ["Cookie", "Authorization"];

// Every scan must reach the server, so it gets the campaign's current target
// and is recorded, and a poster that doesn't exist yet mustn't stay cached as
// missing.
const NO_STORE = { "Cache-Control": "no-store" };

/** Runs a query written as a tagged template, resolving to its rows. */
type Sql = <Row>(
  strings: TemplateStringsArray,
  ...values: unknown[]
) => Promise<Row[]>;

/** An environment variable, as Netlify provides it. */
function env(name: string): string | undefined {
  const { Netlify } = globalThis as {
    Netlify?: { env: { get(name: string): string | undefined } };
  };
  return Netlify?.env.get(name) ?? process.env[name];
}

// The Neon client, kept for the life of the Lambda along with the connection
// string it was made for. Netlify can change the string, as @netlify/database
// allows for, so a new one gets a new client.
let neonClient: { url: string; sql: Sql } | undefined;
// @netlify/database's client, under `netlify dev`.
let localSql: Promise<Sql> | undefined;

/**
 * The database, connected to on first use rather than at module load: a
 * Lambda is frozen after each response, so work left running then can fail,
 * and most scans never query it. On Netlify, queries go to Neon over HTTP
 * with Neon's driver alone, rather than through @netlify/database, which
 * also loads pg, ws and two query builders, and so slows every cold start.
 * `netlify dev` runs a plain Postgres instead, which Neon's HTTP driver can't
 * reach, so there it uses @netlify/database, imported only then.
 */
async function db(): Promise<Sql> {
  if (env("NETLIFY_DB_DRIVER") !== "serverless") {
    localSql ??= import("@netlify/database").then(({ getDatabase }) => {
      const { sql } = getDatabase();
      return (async (strings, ...values) =>
        await sql(strings, ...values)) as Sql;
    });
    return localSql.catch((error: unknown) => {
      // So the next scan tries again.
      localSql = undefined;
      throw error;
    });
  }
  const url = env("NETLIFY_DB_URL");
  if (!url) throw new Error("NETLIFY_DB_URL isn't set");
  if (neonClient?.url !== url) {
    const query = neon(url);
    neonClient = {
      url,
      sql: (async (strings, ...values) =>
        await query(strings, ...values)) as Sql,
    };
  }
  return neonClient.sql;
}

/** Whether `error`, or an error it wraps, has the Postgres `code`. */
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

/**
 * The poster's copied target, or `null` if it hasn't been copied or the copy
 * can't be read, so the caller falls back to the database. Eventually
 * consistent, the default, so it's served from a nearby cache: a new key is
 * readable straight away, and a changed target takes up to 60 seconds to
 * reach every location.
 */
async function readCopiedTarget(
  posterId: string,
  deployContext: string | undefined,
): Promise<string | null> {
  try {
    return await scanTargetStore(deployContext).get(posterId, {
      type: "text",
    });
  } catch (error) {
    console.error(
      `Couldn't read the copied target of poster ${posterId}`,
      error,
    );
    return null;
  }
}

/** The target of the poster's campaign in the database, or `null` if there's no such poster. */
async function findTarget(posterId: string): Promise<string | null> {
  // One query joined on primary keys, reading only the target. The target is
  // followed as stored: only CampaignTarget.create writes it, so it's
  // already been checked (ADR-0019).
  const sql = await db();
  const rows = await sql<{ target: string }>`
    select campaign.target
    from poster
    join poster_design on poster_design.id = poster.poster_design_id
    join campaign on campaign.id = poster_design.campaign_id
    where poster.id = ${posterId}
    limit 1`;
  return rows[0]?.target ?? null;
}

/**
 * Copies the poster's target, found in the database, so its next scan needn't
 * wait for the database. Only if it's still missing: if the campaign's target
 * changed meanwhile, the app has already copied the new one, which mustn't be
 * overwritten with this older one. It runs after the redirect, so it never
 * throws.
 */
async function copyTarget(
  posterId: string,
  target: string,
  deployContext: string | undefined,
): Promise<void> {
  try {
    await scanTargetStore(deployContext).set(posterId, target, {
      onlyIfNew: true,
    });
  } catch (error) {
    console.error(`Couldn't copy the target of poster ${posterId}`, error);
  }
}

/**
 * The "poster not found" page, served at the scan URL with a 404 status
 * (ADR-0019). Only the access headers are passed on, so that a deploy
 * preview's protection lets the page through and the body comes back
 * uncompressed. If the page can't be fetched, the scanner still gets a 404.
 */
async function posterNotFound(request: Request): Promise<Response> {
  const headers = new Headers();
  for (const name of ACCESS_HEADERS) {
    const value = request.headers.get(name);
    if (value !== null) headers.set(name, value);
  }
  try {
    const page = await fetch(new URL(POSTER_NOT_FOUND_PATH, request.url), {
      headers,
    });
    if (page.ok) {
      return new Response(page.body, {
        status: 404,
        headers: {
          ...NO_STORE,
          "Content-Type": page.headers.get("Content-Type") ?? "text/html",
        },
      });
    }
    console.error(`The poster not found page returned ${page.status}`);
  } catch (error) {
    console.error("Couldn't fetch the poster not found page", error);
  }
  return new Response("Poster not found", { status: 404, headers: NO_STORE });
}

/**
 * Records a scan of the poster that happened at `scannedAt`. It runs after
 * the scanner has been redirected, so it never throws: a scan that can't be
 * recorded is logged and lost (ADR-0015). There's no check that the poster
 * exists first (ADR-0019): if it was deleted since the redirect, the insert
 * violates the foreign key and the scan is skipped.
 */
async function recordScan(posterId: string, scannedAt: Date): Promise<void> {
  try {
    const sql = await db();
    // scanned_at has no time zone and holds UTC, so send an ISO string, as
    // Drizzle does, rather than a Date the driver would put in local time.
    await sql`
      insert into scan (id, poster_id, scanned_at)
      values (${crypto.randomUUID()}, ${posterId}, ${scannedAt.toISOString()})`;
  } catch (error) {
    if (hasPgCode(error, FOREIGN_KEY_VIOLATION)) return;
    console.error(`Couldn't record a scan of poster ${posterId}`, error);
  }
}

export default async function redirect(
  request: Request,
  context: RedirectContext,
): Promise<Response> {
  // A warm-up ping only needs the Lambda to run. It touches neither the
  // database, which would stop it scaling to zero, nor Blobs, which has no
  // cold state to warm.
  if (request.headers.has(WARM_UP_HEADER)) {
    return new Response(null, { status: 204, headers: NO_STORE });
  }

  const scannedAt = new Date();
  const posterId = context.params.posterId ?? "";
  // A malformed id can't be a poster, so it's not looked up at all.
  if (!UUID_PATTERN.test(posterId)) return posterNotFound(request);

  const deployContext = context.deploy?.context;
  let target = await readCopiedTarget(posterId, deployContext);
  if (target === null) {
    target = await findTarget(posterId);
    if (target === null) return posterNotFound(request);
    context.waitUntil(copyTarget(posterId, target, deployContext));
  }

  // The scan is recorded after the scanner has been redirected, so they
  // never wait for it. A scan that fails to record is lost (ADR-0015).
  context.waitUntil(recordScan(posterId, scannedAt));

  return new Response(null, {
    status: 307,
    headers: { ...NO_STORE, Location: target },
  });
}

// The permanent scan URL path (ADR-0014). It runs in the site's functions
// region (London, set in the Netlify UI), near the scanners and the
// database; a region here would override it.
export const config = { path: "/redirect/:posterId" };
