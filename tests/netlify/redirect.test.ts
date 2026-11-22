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
async function scan(posterId: string, headers: HeadersInit = {}) {
  const pending: Promise<unknown>[] = [];
  const context = {
    params: { posterId },
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

  it("reuses one database client across scans", async () => {
    await scan(POSTER_ID);
    const opened = neon.mock.calls.length;

    await scan(POSTER_ID);
    await scan(POSTER_ID);

    expect(neon.mock.calls.length).toBe(opened);
    expect(inserts()).toHaveLength(3);
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
        findTargetMs: expect.any(Number),
        handlerMs: expect.any(Number),
      }),
      expect.objectContaining({ event: "record-scan", outcome: "recorded" }),
    ]);
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
