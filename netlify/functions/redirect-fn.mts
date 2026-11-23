import { neon } from "@neondatabase/serverless";
import { getStore } from "@netlify/blobs";

// Temporary: a prototype of the scan redirect as a standard (Node, AWS
// Lambda) function, to compare its cold starts with the edge function's
// (netlify/edge-functions/redirect.ts) from their [redirect-timing] logs.
// Its lines say "runtime": "function". It started as a copy of the edge
// function's handler, and changes here don't go back to it. A scan here is
// recorded like any other. It also answers warm-up pings, which
// warm-redirect-fn.mts sends to keep it warm. Once one runtime wins, it
// serves /redirect/:posterId and the other goes (see ADR-0014). Keep in step:
// - UUID_PATTERN with isUuid (domain/shared/uuid.ts)
// - POSTER_NOT_FOUND_PATH with src/app/(public)/poster-not-found
// - WARM_UP_HEADER with its copy in warm-redirect-fn.mts
// - SCAN_TARGET_REGION and scanTargetStoreName with NetlifyScanTargetCopy
//   (infrastructure/storage/NetlifyScanTargetCopy.ts)
// Anyone can scan a poster, so there's no session check.
//
// Prototype: like the edge function, it reads each poster's copied target
// from Netlify Blobs first, and only queries the database if it's missing.
// So nothing here warms up the database, and a warm-up ping never wakes
// Neon. Blobs has no cold state, so there's nothing there to warm either.

/** The parts of Netlify's function context this uses. */
interface Context {
  requestId?: string;
  params: Record<string, string | undefined>;
  waitUntil(promise: Promise<unknown>): void;
  server?: { region?: string };
  geo?: { country?: { code?: string } };
  deploy?: { context?: string };
}

// A UUID in its canonical, lower-case form, like isUuid in the domain.
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// Postgres's error code for a foreign key violation.
const FOREIGN_KEY_VIOLATION = "23503";

const POSTER_NOT_FOUND_PATH = "/poster-not-found";

// Where the copy of each poster's target is kept. A site-wide store defaults
// to us-east-2, so the region is given on every call, as the app does.
const SCAN_TARGET_REGION = "eu-central-1";

/**
 * The copy's store for the deploy context: deploy previews have their own
 * database, so their own store. "dev" locally.
 */
function scanTargetStoreName(deployContext: string | undefined): string {
  return `scan-targets-${deployContext || "dev"}`;
}

function scanTargets(deployContext: string | undefined) {
  return getStore({
    name: scanTargetStoreName(deployContext),
    region: SCAN_TARGET_REGION,
  });
}

// The headers a deploy preview's access protection checks: its password or
// SSO session cookie, or basic auth.
const ACCESS_HEADERS = ["Cookie", "Authorization"];

// Every scan must reach the server, so it gets the campaign's current target
// and is recorded, and a poster that doesn't exist yet mustn't stay cached as
// missing.
const NO_STORE = { "Cache-Control": "no-store" };

// Diagnostics for slow cold starts. Each request logs one JSON line starting
// with TIMING_LOG, and each recorded scan logs another, so they can be
// filtered in Netlify's function logs. Durations are in milliseconds.
const TIMING_LOG = "[redirect-timing]";

// When this module's body first ran, by the Lambda's clock. The imports are
// evaluated before it, so on a cold Lambda this is roughly how long the
// Lambda took to start and load the bundle.
const moduleEvaluatedAt = performance.now();

// How many requests this Lambda has handled, scans and warm-up pings. The
// first one is a cold start.
let isolateRequests = 0;

// Identifies this Lambda in the logs: every line it writes carries it, so
// lines with the same instance ran on the same one. Random, because Netlify
// doesn't give a handler its Lambda's own id.
const INSTANCE = crypto.randomUUID().slice(0, 8);

/** What a request's log line says about the Lambda it ran on. */
interface Isolate {
  instance: string;
  coldStart: boolean;
  isolateRequests: number;
}

/**
 * Counts a request against this Lambda. Every request calls it once, scan
 * or warm-up ping, so that whichever comes first is the cold one.
 */
function countRequest(): Isolate {
  isolateRequests += 1;
  return {
    instance: INSTANCE,
    coldStart: isolateRequests === 1,
    isolateRequests,
  };
}

// Whether this Lambda has run a query yet. The first one pays for setting
// up the connection, or waking a suspended database.
let hasQueried = false;

// Which runtime this is, for the timing lines, which the edge function's
// lines share.
const RUNTIME = "function";

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

/** Runs a query written as a tagged template, resolving to its rows. */
type Sql = <Row>(
  strings: TemplateStringsArray,
  ...values: unknown[]
) => Promise<Row[]>;

interface Database {
  /** The NETLIFY_DB_DRIVER it was chosen for. */
  driver: string;
  sql: Sql;
}

let database: Promise<Database> | undefined;

/** An environment variable, as Netlify provides it. */
function env(name: string): string | undefined {
  const { Netlify } = globalThis as {
    Netlify?: { env: { get(name: string): string | undefined } };
  };
  return Netlify?.env.get(name);
}

/**
 * Connects to the database. On Netlify the driver is "serverless", and
 * queries go to Neon over HTTP with the Neon driver alone, rather than
 * through @netlify/database, which also loads pg, ws and two query builders
 * and so slows every cold start. `netlify dev` runs a plain Postgres instead
 * ("server"), which Neon's HTTP driver can't reach, so there it falls back
 * to @netlify/database, imported only then so production never loads it.
 */
async function connect(): Promise<Database> {
  const driver = env("NETLIFY_DB_DRIVER") ?? "server";
  if (driver === "serverless") {
    const url = env("NETLIFY_DB_URL");
    if (!url) throw new Error("NETLIFY_DB_URL isn't set");
    const query = neon(url);
    return {
      driver,
      sql: async <Row,>(strings: TemplateStringsArray, ...values: unknown[]) =>
        (await query(strings, ...values)) as Row[],
    };
  }
  const { getDatabase } = await import("@netlify/database");
  const local = getDatabase();
  return {
    driver,
    sql: async <Row,>(strings: TemplateStringsArray, ...values: unknown[]) =>
      (await local.sql(strings, ...values)) as Row[],
  };
}

/**
 * The database client, created on first use and kept for the life of the
 * Lambda, so that its connections are reused. If connecting fails, the
 * next call tries again. `timings` gets how long connecting took, if it
 * happened now, and which driver it uses.
 */
async function db(timings?: Record<string, unknown>): Promise<Database> {
  if (!database) {
    const start = performance.now();
    database = connect().catch((error: unknown) => {
      database = undefined;
      throw error;
    });
    const connected = await database;
    if (timings) timings.dbCreateMs = since(start);
    if (timings) timings.dbDriver = connected.driver;
    return connected;
  }
  const connected = await database;
  if (timings) timings.dbDriver = connected.driver;
  return connected;
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
  const client = await db(timings);
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
 * The poster's copied target, or `null` if it hasn't been copied or the copy
 * can't be read, so the caller falls back to the database. `timings` gets
 * how long the read took and whether it found the poster.
 */
async function readCopiedTarget(
  posterId: string,
  deployContext: string | undefined,
  timings: Record<string, unknown>,
): Promise<string | null> {
  const start = performance.now();
  try {
    // Eventually consistent, the default, so it's served from the nearest
    // edge cache. A new key is readable straight away; a changed target
    // takes up to 60 seconds to reach every location.
    const target = await scanTargets(deployContext).get(posterId, {
      type: "text",
    });
    timings.blobHit = target !== null;
    return target;
  } catch (error) {
    timings.blobHit = false;
    timings.blobReadFailed = true;
    console.error(
      `Couldn't read the copied target of poster ${posterId}`,
      error,
    );
    return null;
  } finally {
    timings.blobReadMs = since(start);
  }
}

/**
 * Copies the poster's target, found in the database, so its next scan needn't
 * wait for the database. Only if it's still missing: if the campaign's target
 * changed meanwhile, the app has already copied the new one, which mustn't be
 * overwritten with this older one. It runs after the redirect, so it never
 * throws, and logs how long it took.
 */
async function copyTarget(
  posterId: string,
  target: string,
  deployContext: string | undefined,
  requestId: string | undefined,
): Promise<void> {
  const start = performance.now();
  let outcome = "copied";
  try {
    const { modified } = await scanTargets(deployContext).set(
      posterId,
      target,
      { onlyIfNew: true },
    );
    if (!modified) outcome = "already copied";
  } catch (error) {
    outcome = "failed";
    console.error(`Couldn't copy the target of poster ${posterId}`, error);
  } finally {
    logTiming("copy-target", {
      runtime: RUNTIME,
      requestId,
      outcome,
      blobWriteMs: since(start),
    });
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
    await (
      await db()
    ).sql`
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
      runtime: RUNTIME,
      instance: INSTANCE,
      requestId,
      outcome,
      insertMs: since(start),
    });
  }
}

async function redirect(request: Request, context: Context) {
  const handlerStart = performance.now();
  const scannedAt = new Date();
  // Filled in by each step and logged once the response is ready.
  const timings: Record<string, unknown> = {
    runtime: RUNTIME,
    requestId: context.requestId,
    ...countRequest(),
    // Lambda start to module evaluated, and module evaluated to
    // this request. On a cold start, together they're the time before the
    // handler ran.
    moduleEvaluatedAtMs: moduleEvaluatedAt,
    moduleToHandlerMs: handlerStart - moduleEvaluatedAt,
    region: context.server?.region,
    country: context.geo?.country?.code,
    deployContext: context.deploy?.context,
  };
  const posterId = context.params.posterId ?? "";
  const deployContext = context.deploy?.context;

  let response: Response | undefined;
  try {
    // A malformed id can't have been copied, so it goes straight to
    // findTarget, which rejects it without a query.
    let target = UUID_PATTERN.test(posterId)
      ? await readCopiedTarget(posterId, deployContext, timings)
      : null;
    if (target === null) {
      target = await findTarget(posterId, timings);
      if (target) {
        context.waitUntil(
          copyTarget(posterId, target, deployContext, context.requestId),
        );
      }
    }
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

// The header warm-redirect-fn.mts sends to keep this function's Lambda warm.
const WARM_UP_HEADER = "X-Warm-Up";

export default async function redirectFn(request: Request, context: Context) {
  // A warm-up ping only needs the Lambda to run: it skips the handler, so it
  // never reads Blobs, queries the database, fetches the not found page or
  // records a scan. A scan reads its target from Blobs, so it no longer
  // waits for Neon, and there's no need to wake it. It counts as a request,
  // so a scan after it isn't logged as a cold start, and its line carries
  // the Lambda's instance, like the scans' lines.
  if (request.headers.has(WARM_UP_HEADER)) {
    logTiming("warm-up-ping", {
      runtime: RUNTIME,
      requestId: context.requestId,
      ...countRequest(),
    });
    return new Response(null, { status: 204, headers: NO_STORE });
  }
  return redirect(request, context);
}

// It runs in the site's functions region (London, set in the Netlify UI),
// near the scanners and the database. A region here would override it.
export const config = { path: "/redirect-fn/:posterId" };
