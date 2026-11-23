import type { Context } from "@netlify/edge-functions";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import redirect from "../../netlify/edge-functions/redirect";

// Stand-ins for the database drivers: Neon's, used on Netlify, and
// @netlify/database's, used under `netlify dev`. Each query is recorded as
// its SQL text (with "?" for each value), its values and the driver that ran
// it, and answered by `answer`.
type Query = { text: string; values: unknown[]; driver: string };
const queries: Query[] = [];
let answer: (query: Query) => unknown[] = () => [];

function fakeSql(driver: string) {
  return async (strings: TemplateStringsArray, ...values: unknown[]) => {
    const query = { text: strings.join("?"), values, driver };
    queries.push(query);
    return answer(query);
  };
}

const { neon, getDatabase } = vi.hoisted(() => ({
  neon: vi.fn(),
  getDatabase: vi.fn(),
}));
vi.mock("@neondatabase/serverless", () => ({ neon }));
vi.mock("@netlify/database", () => ({ getDatabase }));
neon.mockImplementation(() => fakeSql("neon"));

// Stands in for Netlify Blobs, which holds the copy of each poster's target:
// each store's entries by its region and name, as a store opened without the
// right region sees nothing. `failReads` makes every read throw.
const fakeBlobs = vi.hoisted(() => ({
  stores: new Map<string, Map<string, string>>(),
  reads: [] as string[],
  failReads: false,
}));
vi.mock("@netlify/blobs", () => ({
  getStore: ({ name, region }: { name: string; region?: string }) => {
    const id = `${region ?? "us-east-2"}/${name}`;
    const entries = fakeBlobs.stores.get(id) ?? new Map<string, string>();
    fakeBlobs.stores.set(id, entries);
    return {
      async get(key: string) {
        fakeBlobs.reads.push(`${id}/${key}`);
        if (fakeBlobs.failReads) throw new Error("Blobs unavailable");
        return entries.get(key) ?? null;
      },
      async set(key: string, value: string, options?: { onlyIfNew?: boolean }) {
        if (options?.onlyIfNew && entries.has(key)) return { modified: false };
        entries.set(key, value);
        return { modified: true };
      },
    };
  },
}));

/** The store a local scan reads, in the region the app writes to. */
function copiedTargets(deployContext = "dev") {
  const id = `eu-central-1/scan-targets-${deployContext}`;
  const entries = fakeBlobs.stores.get(id) ?? new Map<string, string>();
  fakeBlobs.stores.set(id, entries);
  return entries;
}
getDatabase.mockImplementation(() => ({ sql: fakeSql("netlify-database") }));

const DB_URL = "postgres://user:password@db.example/poster";

// The environment Netlify's edge runtime provides, through its Netlify
// global. On Netlify the driver is "serverless".
let environment: Record<string, string>;
function stubNetlifyEnv() {
  vi.stubGlobal("Netlify", {
    env: { get: (name: string) => environment[name] },
  });
}

const POSTER_ID = "6f1c2a4e-8b3d-4f7a-9c2e-1d5b7a9e3f40";
const TARGET = "https://example.com/";
const NOW = new Date("2026-11-22T20:03:43.300Z");

function isTargetQuery(query: Query) {
  return query.text.includes("select campaign.target");
}
function inserts() {
  return queries.filter((query) => query.text.includes("insert into scan"));
}

/** Scans `posterId`, returning the response and the work left running. */
async function scan(
  posterId: string,
  headers: HeadersInit = {},
  deployContext?: string,
) {
  const pending: Promise<unknown>[] = [];
  const context = {
    params: { posterId },
    deploy: deployContext ? { context: deployContext } : undefined,
    waitUntil: (promise: Promise<unknown>) => pending.push(promise),
  } as unknown as Context;
  const request = new Request(
    `https://postertrace.example/redirect/${posterId}`,
    {
      headers,
    },
  );
  const response = await redirect(request, context);
  await Promise.all(pending);
  return response;
}

/**
 * Scans a poster with a fresh copy of the edge function. The database client
 * is kept for the life of the module, so this connects again, with the
 * current environment.
 */
async function scanWithFreshModule() {
  vi.resetModules();
  const { default: freshRedirect } =
    await import("../../netlify/edge-functions/redirect");
  const context = {
    params: { posterId: POSTER_ID },
    waitUntil: () => {},
  } as unknown as Context;
  return freshRedirect(
    new Request(`https://postertrace.example/redirect/${POSTER_ID}`),
    context,
  );
}

const fetchPage = vi.fn<typeof fetch>();

beforeEach(() => {
  queries.length = 0;
  fakeBlobs.stores.clear();
  fakeBlobs.reads.length = 0;
  fakeBlobs.failReads = false;
  answer = (query) => (isTargetQuery(query) ? [{ target: TARGET }] : []);
  fetchPage.mockReset();
  fetchPage.mockResolvedValue(
    new Response("<h1>Poster not found</h1>", {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    }),
  );
  vi.stubGlobal("fetch", fetchPage);
  environment = { NETLIFY_DB_DRIVER: "serverless", NETLIFY_DB_URL: DB_URL };
  stubNetlifyEnv();
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.useFakeTimers({ now: NOW, toFake: ["Date"] });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("scanning an existing poster", () => {
  it("redirects to the campaign's target, uncached", async () => {
    const response = await scan(POSTER_ID);

    expect(response.status).toBe(307);
    expect(response.headers.get("Location")).toBe(TARGET);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(queries.find(isTargetQuery)?.values).toEqual([POSTER_ID]);
  });

  it("records the scan with the time the request arrived, in UTC", async () => {
    await scan(POSTER_ID);

    const [insert] = inserts();
    expect(insert.values).toEqual([
      expect.stringMatching(/^[0-9a-f-]{36}$/),
      POSTER_ID,
      "2026-11-22T20:03:43.300Z",
    ]);
  });

  it("skips the scan quietly if the poster was deleted since the redirect", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    answer = (query) => {
      if (isTargetQuery(query)) return [{ target: TARGET }];
      // How the driver reports it: the Postgres error wrapped in another.
      throw new Error("Query failed", { cause: { code: "23503" } });
    };

    const response = await scan(POSTER_ID);

    expect(response.status).toBe(307);
    expect(error).not.toHaveBeenCalled();
  });

  it("logs a scan that can't be recorded, still redirecting", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    answer = (query) => {
      if (isTargetQuery(query)) return [{ target: TARGET }];
      throw new Error("Connection lost");
    };

    const response = await scan(POSTER_ID);

    expect(response.status).toBe(307);
    expect(error).toHaveBeenCalledWith(
      `Couldn't record a scan of poster ${POSTER_ID}`,
      expect.any(Error),
    );
  });

  it("queries Neon over HTTP with the deploy's connection string", async () => {
    neon.mockClear();

    await scanWithFreshModule();

    expect(neon).toHaveBeenCalledWith(DB_URL);
    expect(queries.find(isTargetQuery)?.driver).toBe("neon");
  });

  it("opens the connection when the module loads, before the first lookup", async () => {
    await scanWithFreshModule();

    expect(queries.slice(0, 2).map((query) => query.text.trim())).toEqual([
      "select 1",
      expect.stringContaining("select campaign.target"),
    ]);
    const log = vi.mocked(console.log);
    const [, json] = log.mock.calls.find(
      ([tag, line]) =>
        tag === "[redirect-timing]" && String(line).includes('"redirect"'),
    )!;
    expect(JSON.parse(json as string)).toMatchObject({
      warmUpMs: expect.any(Number),
      waitedForWarmUpMs: expect.any(Number),
    });
  });

  it("still redirects if the warm-up fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    answer = (query) => {
      if (query.text.includes("select 1")) throw new Error("Network down");
      return isTargetQuery(query) ? [{ target: TARGET }] : [];
    };

    const response = await scanWithFreshModule();

    expect(response.status).toBe(307);
    expect(console.error).toHaveBeenCalledWith(
      "Couldn't warm up the database connection",
      expect.any(Error),
    );
  });

  it("is served by the comparison function too", async () => {
    const fn = await import("../../netlify/functions/redirect-fn.mjs");
    const context = {
      params: { posterId: POSTER_ID },
      waitUntil: () => {},
    } as unknown as Context;

    const response = await fn.default(
      new Request(`https://postertrace.example/redirect-fn/${POSTER_ID}`),
      context,
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("Location")).toBe(TARGET);
    expect(fn.config.path).toBe("/redirect-fn/:posterId");
  });

  it("reads the copied target in the comparison function too", async () => {
    const fn = await import("../../netlify/functions/redirect-fn.mjs");
    copiedTargets().set(POSTER_ID, "https://example.com/copied");
    queries.length = 0;
    const context = {
      params: { posterId: POSTER_ID },
      waitUntil: () => {},
    } as unknown as Context;

    const response = await fn.default(
      new Request(`https://postertrace.example/redirect-fn/${POSTER_ID}`),
      context,
    );

    expect(response.headers.get("Location")).toBe("https://example.com/copied");
    expect(queries.filter(isTargetQuery)).toEqual([]);
  });

  it("answers a warm-up ping to the comparison function without a scan", async () => {
    const fn = await import("../../netlify/functions/redirect-fn.mjs");
    queries.length = 0;
    const context = {
      params: { posterId: "warm-up" },
      waitUntil: () => {},
    } as unknown as Context;

    const response = await fn.default(
      new Request("https://postertrace.example/redirect-fn/warm-up", {
        headers: { "X-Warm-Up": "1" },
      }),
      context,
    );

    expect(response.status).toBe(204);
    expect(queries).toEqual([]);
    expect(inserts()).toEqual([]);
    expect(fetchPage).not.toHaveBeenCalled();
  });

  it("reuses one database client across scans", async () => {
    await scan(POSTER_ID);
    const opened = neon.mock.calls.length;

    await scan(POSTER_ID);
    await scan(POSTER_ID);

    expect(neon.mock.calls.length).toBe(opened);
    expect(inserts()).toHaveLength(3);
  });

  it("counts a warm-up ping as the Lambda's cold start, and names the Lambda", async () => {
    vi.resetModules();
    const fn = await import("../../netlify/functions/redirect-fn.mjs");
    const log = vi.mocked(console.log);
    log.mockClear();
    const context = (posterId: string) =>
      ({ params: { posterId }, waitUntil: () => {} }) as unknown as Context;

    await fn.default(
      new Request("https://postertrace.example/redirect-fn/warm-up", {
        headers: { "X-Warm-Up": "1" },
      }),
      context("warm-up"),
    );
    await fn.default(
      new Request(`https://postertrace.example/redirect-fn/${POSTER_ID}`),
      context(POSTER_ID),
    );

    const [ping, redirectLine] = log.mock.calls
      .filter(([tag]) => tag === "[redirect-timing]")
      .map(([, json]) => JSON.parse(json as string));
    expect(ping).toMatchObject({
      event: "warm-up-ping",
      coldStart: true,
      isolateRequests: 1,
      instance: expect.stringMatching(/^[0-9a-f]{8}$/),
    });
    expect(redirectLine).toMatchObject({
      event: "redirect",
      coldStart: false,
      isolateRequests: 2,
      instance: ping.instance,
    });
  });

  it("answers a warm-up ping only once the database warm-up has finished", async () => {
    // Only the warm-up's query, the first, is held until released.
    let finishWarmUpQuery: (() => void) | undefined;
    answer = (query) => {
      if (query.text.includes("select 1") && !finishWarmUpQuery) {
        return new Promise<unknown[]>((resolve) => {
          finishWarmUpQuery = () => resolve([]);
        }) as unknown as unknown[];
      }
      return [];
    };
    vi.resetModules();
    const fn = await import("../../netlify/functions/redirect-fn.mjs");
    let answered = false;

    const ping = fn
      .default(
        new Request("https://postertrace.example/redirect-fn/warm-up", {
          headers: { "X-Warm-Up": "1" },
        }),
        {
          params: { posterId: "warm-up" },
          waitUntil: () => {},
        } as unknown as Context,
      )
      .then((response) => {
        answered = true;
        return response;
      });
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(answered).toBe(false);

    finishWarmUpQuery?.();

    expect((await ping).status).toBe(204);
    expect(
      queries.filter((query) => query.text.includes("select 1")),
    ).toHaveLength(1);
  });

  it("logs how long each step took", async () => {
    const log = vi.mocked(console.log);

    await scan(POSTER_ID);

    const lines = log.mock.calls
      .filter(([tag]) => tag === "[redirect-timing]")
      .map(([, json]) => JSON.parse(json as string));
    expect(lines).toEqual([
      expect.objectContaining({
        event: "redirect",
        status: 307,
        blobHit: false,
        blobReadMs: expect.any(Number),
        findTargetMs: expect.any(Number),
        handlerMs: expect.any(Number),
      }),
      expect.objectContaining({ event: "copy-target", outcome: "copied" }),
      expect.objectContaining({ event: "record-scan", outcome: "recorded" }),
    ]);
  });
});

describe("scanning a poster whose target has been copied", () => {
  beforeEach(() => {
    copiedTargets().set(POSTER_ID, "https://example.com/copied");
  });

  it("redirects to the copied target without querying the database", async () => {
    const response = await scan(POSTER_ID);

    expect(response.status).toBe(307);
    expect(response.headers.get("Location")).toBe("https://example.com/copied");
    expect(queries.filter(isTargetQuery)).toEqual([]);
  });

  it("still records the scan afterwards", async () => {
    await scan(POSTER_ID);

    expect(inserts()).toHaveLength(1);
  });

  it("logs that the copy had the poster, and how long reading it took", async () => {
    const log = vi.mocked(console.log);

    await scan(POSTER_ID);

    const [line] = log.mock.calls
      .filter(([tag]) => tag === "[redirect-timing]")
      .map(([, json]) => JSON.parse(json as string));
    expect(line).toMatchObject({
      event: "redirect",
      blobHit: true,
      blobReadMs: expect.any(Number),
    });
    expect(line).not.toHaveProperty("findTargetMs");
  });

  it("reads the store for the deploy's context", async () => {
    copiedTargets("deploy-preview").set(POSTER_ID, "https://example.com/pr");

    const response = await scan(POSTER_ID, {}, "deploy-preview");

    expect(response.headers.get("Location")).toBe("https://example.com/pr");
  });
});

describe("scanning a poster whose target hasn't been copied", () => {
  it("redirects to the target from the database and copies it", async () => {
    const response = await scan(POSTER_ID);

    expect(response.headers.get("Location")).toBe(TARGET);
    expect(copiedTargets().get(POSTER_ID)).toBe(TARGET);
  });

  it("doesn't overwrite a target copied while it looked in the database", async () => {
    // As if the campaign's target changed, and the app copied the new one,
    // between the lookup and the copy.
    answer = (query) => {
      if (!isTargetQuery(query)) return [];
      copiedTargets().set(POSTER_ID, "https://example.com/new");
      return [{ target: TARGET }];
    };

    await scan(POSTER_ID);

    expect(copiedTargets().get(POSTER_ID)).toBe("https://example.com/new");
  });

  it("falls back to the database if the copy can't be read", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    fakeBlobs.failReads = true;

    const response = await scan(POSTER_ID);

    expect(response.headers.get("Location")).toBe(TARGET);
    expect(error).toHaveBeenCalledWith(
      `Couldn't read the copied target of poster ${POSTER_ID}`,
      expect.any(Error),
    );
  });

  it("copies nothing for a poster that doesn't exist", async () => {
    answer = () => [];

    const response = await scan(POSTER_ID);

    expect(response.status).toBe(404);
    expect(copiedTargets().has(POSTER_ID)).toBe(false);
  });
});

describe("scanning under netlify dev", () => {
  it("uses the local Postgres through @netlify/database", async () => {
    environment = { NETLIFY_DB_DRIVER: "server", NETLIFY_DB_URL: DB_URL };
    neon.mockClear();

    const response = await scanWithFreshModule();

    expect(response.status).toBe(307);
    expect(neon).not.toHaveBeenCalled();
    expect(queries.find(isTargetQuery)?.driver).toBe("netlify-database");
  });
});

describe("scanning a poster that doesn't exist", () => {
  it("shows the poster not found page with a 404, uncached", async () => {
    answer = () => [];

    const response = await scan(POSTER_ID);

    expect(response.status).toBe(404);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("Content-Type")).toBe(
      "text/html; charset=utf-8",
    );
    expect(await response.text()).toBe("<h1>Poster not found</h1>");
    expect(String(fetchPage.mock.calls[0][0])).toBe(
      "https://postertrace.example/poster-not-found",
    );
    expect(inserts()).toHaveLength(0);
  });

  it.each([
    ["a malformed id", "not-a-poster"],
    ["an upper-case UUID", POSTER_ID.toUpperCase()],
  ])("treats %s as not found without querying", async (_name, posterId) => {
    const response = await scan(posterId);

    expect(response.status).toBe(404);
    expect(queries).toHaveLength(0);
    expect(fakeBlobs.reads).toEqual([]);
  });

  it("passes on only the headers access protection checks", async () => {
    answer = () => [];

    await scan(POSTER_ID, {
      Cookie: "nf_jwt=token",
      Authorization: "Basic abc",
      "Accept-Encoding": "gzip",
    });

    const headers = new Headers(fetchPage.mock.calls[0][1]?.headers);
    expect(headers.get("Cookie")).toBe("nf_jwt=token");
    expect(headers.get("Authorization")).toBe("Basic abc");
    expect(headers.get("Accept-Encoding")).toBeNull();
  });

  it.each([
    [
      "the page fails to load",
      () => fetchPage.mockRejectedValue(new Error("Network down")),
    ],
    [
      "the page returns an error",
      () => fetchPage.mockResolvedValue(new Response("Oops", { status: 500 })),
    ],
  ])("still returns a 404 if %s", async (_name, failPage) => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    answer = () => [];
    failPage();

    const response = await scan(POSTER_ID);

    expect(response.status).toBe(404);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.text()).toBe("Poster not found");
  });
});
