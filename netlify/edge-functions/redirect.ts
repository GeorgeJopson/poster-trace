import { getDatabase } from "@netlify/database";
import type { Config, Context } from "@netlify/edge-functions";

// Where every poster's QR code points (see ADR-0014). It's an edge function
// rather than a Next route so that a scan never waits for the Next server to
// start. The edge runtime (Deno) can't import the app's layers, which use
// extensionless imports and tsconfig path aliases, so this is the only code
// that reads a scan's target or records a scan (see ADR-0019). Keep in step:
// - UUID_PATTERN with isUuid (domain/shared/uuid.ts)
// - POSTER_NOT_FOUND_PATH with src/app/(public)/poster-not-found
// Anyone can scan a poster, so there's no session check.

// A UUID in its canonical, lower-case form, like isUuid in the domain.
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// Postgres's error code for a foreign key violation.
const FOREIGN_KEY_VIOLATION = "23503";

const POSTER_NOT_FOUND_PATH = "/poster-not-found";

// The headers a deploy preview's access protection checks: its password or
// SSO session cookie, or basic auth.
const ACCESS_HEADERS = ["Cookie", "Authorization"];

// Every scan must reach the server, so it gets the campaign's current target
// and is recorded, and a poster that doesn't exist yet mustn't stay cached as
// missing.
const NO_STORE = { "Cache-Control": "no-store" };

// Diagnostics for slow cold starts. Each request logs one JSON line starting
// with TIMING_LOG, and each recorded scan logs another, so they can be
// filtered in Netlify's edge function logs. Durations are in milliseconds.
const TIMING_LOG = "[redirect-timing]";

// When this module's body first ran, by the isolate's clock. The imports are
// evaluated before it, so on a cold isolate this is roughly how long the
// isolate took to start and load the bundle.
const moduleEvaluatedAt = performance.now();

// How many requests this isolate has handled. The first one is a cold start.
let isolateRequests = 0;

// Whether this isolate has run a query yet. The first one pays for setting
// up the connection, or waking a suspended database.
let hasQueried = false;

/** Logs a timing line, rounding durations to a tenth of a millisecond. */
function logTiming(event: string, fields: Record<string, unknown>): void {
  const rounded = Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [
      key,
      typeof value === "number" ? Math.round(value * 10) / 10 : value,
    ]),
  );
  console.log(TIMING_LOG, JSON.stringify({ event, ...rounded }));
}

/** Milliseconds since `start`, a `performance.now()` reading. */
function since(start: number): number {
  return performance.now() - start;
}

type Database = ReturnType<typeof getDatabase>;
let database: Database | undefined;

/**
 * The database client, created on first use and kept for the life of the
 * isolate. Each getDatabase() call opens a new connection pool, so it's
 * called only once. `timings` gets how long creating it took, if it was
 * created now, and which driver it uses.
 */
function db(timings?: Record<string, unknown>): Database {
  if (!database) {
    const start = performance.now();
    database = getDatabase();
    if (timings) timings.dbCreateMs = since(start);
  }
  if (timings) timings.dbDriver = database.driver;
  return database;
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
 * The target of the poster's campaign, or `null` if there's no such poster.
 * `timings` gets how long the lookup took.
 */
async function findTarget(
  posterId: string,
  timings: Record<string, unknown>,
): Promise<string | null> {
  if (!UUID_PATTERN.test(posterId)) {
    timings.validId = false;
    return null;
  }
  timings.validId = true;
  const client = db(timings);
  timings.firstQueryOnIsolate = !hasQueried;
  hasQueried = true;
  // Every scan runs this, so it's one query joined on primary keys, reading
  // only the target. The target is followed as stored: only
  // CampaignTarget.create writes it, so it's already been checked (ADR-0019).
  const start = performance.now();
  try {
    const rows = await client.sql<{ target: string }>`
      select campaign.target
      from poster
      join poster_design on poster_design.id = poster.poster_design_id
      join campaign on campaign.id = poster_design.campaign_id
      where poster.id = ${posterId}
      limit 1`;
    return rows[0]?.target ?? null;
  } finally {
    timings.findTargetMs = since(start);
  }
}

/**
 * The "poster not found" page, served at the scan URL with a 404 status
 * (ADR-0019). Only the access headers are passed on, so that a deploy
 * preview's protection lets the page through and the body comes back
 * uncompressed. If the page can't be fetched, the scanner still gets a 404.
 * `timings` gets how long fetching the page took and its status.
 */
async function posterNotFound(
  request: Request,
  timings: Record<string, unknown>,
): Promise<Response> {
  const headers = new Headers();
  for (const name of ACCESS_HEADERS) {
    const value = request.headers.get(name);
    if (value !== null) headers.set(name, value);
  }
  const start = performance.now();
  try {
    const page = await fetch(new URL(POSTER_NOT_FOUND_PATH, request.url), {
      headers,
    });
    // Until its headers arrive, which includes any Next server cold start.
    timings.notFoundPageMs = since(start);
    timings.notFoundPageStatus = page.status;
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
    timings.notFoundPageMs = since(start);
    console.error("Couldn't fetch the poster not found page", error);
  }
  return new Response("Poster not found", { status: 404, headers: NO_STORE });
}

/**
 * Records a scan of the poster that happened at `scannedAt`. It runs after
 * the scanner has been redirected, so it never throws: a scan that can't be
 * recorded is logged and lost (ADR-0015). There's no check that the poster
 * exists first (ADR-0019): if it was deleted since the redirect, the insert
 * violates the foreign key and the scan is skipped. It logs how long the
 * insert took, tagged with the request's `requestId`.
 */
async function recordScan(
  posterId: string,
  scannedAt: Date,
  requestId: string | undefined,
): Promise<void> {
  const start = performance.now();
  let outcome = "recorded";
  try {
    // scanned_at has no time zone and holds UTC, so send an ISO string, as
    // Drizzle does, rather than a Date the driver would put in local time.
    await db().sql`
      insert into scan (id, poster_id, scanned_at)
      values (${crypto.randomUUID()}, ${posterId}, ${scannedAt.toISOString()})`;
  } catch (error) {
    if (hasPgCode(error, FOREIGN_KEY_VIOLATION)) {
      outcome = "poster deleted";
      return;
    }
    outcome = "failed";
    console.error(`Couldn't record a scan of poster ${posterId}`, error);
  } finally {
    logTiming("record-scan", {
      requestId,
      outcome,
      insertMs: since(start),
    });
  }
}

export default async function redirect(request: Request, context: Context) {
  const handlerStart = performance.now();
  const scannedAt = new Date();
  isolateRequests += 1;
  // Filled in by each step and logged once the response is ready.
  const timings: Record<string, unknown> = {
    requestId: context.requestId,
    coldStart: isolateRequests === 1,
    isolateRequests,
    // Isolate start to module evaluated, and module evaluated to this
    // request. On a cold start, together they're the time before the
    // handler ran.
    moduleEvaluatedAtMs: moduleEvaluatedAt,
    moduleToHandlerMs: handlerStart - moduleEvaluatedAt,
    edgeRegion: context.server?.region,
    country: context.geo?.country?.code,
    deployContext: context.deploy?.context,
  };
  const posterId = context.params.posterId ?? "";

  let response: Response | undefined;
  try {
    const target = await findTarget(posterId, timings);
    if (!target) {
      response = await posterNotFound(request, timings);
      return response;
    }

    // The scan is recorded after the scanner has been redirected, so they
    // never wait for it. A scan that fails to record is lost (see ADR-0015).
    context.waitUntil(recordScan(posterId, scannedAt, context.requestId));

    response = new Response(null, {
      status: 307,
      headers: { ...NO_STORE, Location: target },
    });
    return response;
  } finally {
    logTiming("redirect", {
      ...timings,
      status: response?.status ?? "threw",
      handlerMs: since(handlerStart),
    });
  }
}

export const config: Config = { path: "/redirect/:posterId" };
