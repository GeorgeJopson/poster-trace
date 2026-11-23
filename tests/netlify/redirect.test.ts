import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { RedirectContext } from "../../netlify/functions/redirect.mjs";

// Loaded afresh for each test, as it keeps its database client for the life
// of the Lambda.
let redirect: typeof import("../../netlify/functions/redirect.mjs").default;

// Stand-ins for the database drivers. Each query is recorded as its SQL text
// (with "?" for each value) and its values, and answered by `answer`. On
// Netlify the function queries Neon over HTTP; under `netlify dev` it goes
// through @netlify/database.
type Query = { text: string; values: unknown[] };
const queries: Query[] = [];
let answer: (query: Query) => unknown[] = () => [];

async function runQuery(strings: TemplateStringsArray, ...values: unknown[]) {
  const query = { text: strings.join("?"), values };
  queries.push(query);
  return answer(query);
}

const { neon, getDatabase } = vi.hoisted(() => ({
  neon: vi.fn(),
  getDatabase: vi.fn(),
}));
vi.mock("@neondatabase/serverless", () => ({ neon }));
vi.mock("@netlify/database", () => ({ getDatabase }));

/**
 * Stands in for Netlify Blobs: each store's entries, keyed like the adapter's
 * test, a site-wide store by its region and name, a deploy store by its name.
 * `blobs.failReads` and `blobs.failWrites` make every read or write throw.
 */
const blobs = vi.hoisted(() => ({
  stores: new Map<string, Map<string, string>>(),
  reads: 0,
  failReads: false,
  failWrites: false,
}));
vi.mock("@netlify/blobs", () => {
  function store(id: string) {
    return {
      async get(key: string, { type }: { type: string }) {
        blobs.reads += 1;
        if (blobs.failReads) throw new Error("Blobs is down");
        if (type !== "text") throw new Error(`Unexpected type ${type}`);
        return blobs.stores.get(id)?.get(key) ?? null;
      },
      async set(
        key: string,
        value: string,
        { onlyIfNew }: { onlyIfNew?: boolean } = {},
      ) {
        if (blobs.failWrites) throw new Error("Blobs is down");
        const entries = blobs.stores.get(id) ?? new Map<string, string>();
        blobs.stores.set(id, entries);
        if (onlyIfNew && entries.has(key)) return { modified: false };
        entries.set(key, value);
        return { modified: true };
      },
    };
  }
  return {
    getStore: ({ name, region }: { name: string; region?: string }) =>
      store(`site:${region ?? "us-east-2"}/${name}`),
    getDeployStore: ({ name }: { name: string }) => store(`deploy:${name}`),
  };
});

const PRODUCTION_STORE = "site:eu-central-1/scan-targets-production";
const DEPLOY_STORE = "deploy:scan-targets";

const POSTER_ID = "6f1c2a4e-8b3d-4f7a-9c2e-1d5b7a9e3f40";
const TARGET = "https://example.com/";
const NOW = new Date("2026-11-22T20:03:43.300Z");

function isTargetQuery(query: Query) {
  return query.text.includes("select campaign.target");
}
function targetQueries() {
  return queries.filter(isTargetQuery);
}
function inserts() {
  return queries.filter((query) => query.text.includes("insert into scan"));
}

/** Puts a copy of the poster's target in the store. */
function copyTarget(
  posterId: string,
  target: string,
  store = PRODUCTION_STORE,
) {
  const entries = blobs.stores.get(store) ?? new Map<string, string>();
  blobs.stores.set(store, entries);
  entries.set(posterId, target);
}
function copiedTarget(posterId: string, store = PRODUCTION_STORE) {
  return blobs.stores.get(store)?.get(posterId);
}

/**
 * Scans `posterId` on a deploy in `deployContext`, returning the response
 * once the work left running has finished.
 */
async function scan(
  posterId: string,
  {
    headers = {},
    deployContext = "production",
  }: { headers?: HeadersInit; deployContext?: string } = {},
) {
  const pending: Promise<unknown>[] = [];
  const context: RedirectContext = {
    params: { posterId },
    deploy: { context: deployContext },
    waitUntil: (promise) => void pending.push(promise),
  };
  const request = new Request(
    `https://postertrace.example/redirect/${posterId}`,
    { headers },
  );
  const response = await redirect(request, context);
  await Promise.all(pending);
  return response;
}

const fetchPage = vi.fn<typeof fetch>();

beforeEach(async () => {
  vi.resetModules();
  ({ default: redirect } =
    await import("../../netlify/functions/redirect.mjs"));
  queries.length = 0;
  answer = (query) => (isTargetQuery(query) ? [{ target: TARGET }] : []);
  neon.mockReset();
  neon.mockImplementation(() => runQuery);
  getDatabase.mockReset();
  getDatabase.mockImplementation(() => ({ sql: runQuery }));
  vi.stubEnv("NETLIFY_DB_DRIVER", "serverless");
  vi.stubEnv("NETLIFY_DB_URL", "postgres://neon.example/db");
  blobs.stores.clear();
  blobs.reads = 0;
  blobs.failReads = false;
  blobs.failWrites = false;
  fetchPage.mockReset();
  fetchPage.mockResolvedValue(
    new Response("<h1>Poster not found</h1>", {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    }),
  );
  vi.stubGlobal("fetch", fetchPage);
  vi.useFakeTimers({ now: NOW, toFake: ["Date"] });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("scanning a poster whose target is copied", () => {
  it("redirects to the copied target, uncached, without querying it", async () => {
    copyTarget(POSTER_ID, "https://example.com/copied");

    const response = await scan(POSTER_ID);

    expect(response.status).toBe(307);
    expect(response.headers.get("Location")).toBe("https://example.com/copied");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(targetQueries()).toHaveLength(0);
  });

  it("records the scan with the time the request arrived, in UTC", async () => {
    copyTarget(POSTER_ID, TARGET);

    await scan(POSTER_ID);

    const [insert] = inserts();
    expect(insert.values).toEqual([
      expect.stringMatching(/^[0-9a-f-]{36}$/),
      POSTER_ID,
      "2026-11-22T20:03:43.300Z",
    ]);
  });

  it("reads a deploy preview's copy from that deploy's own store", async () => {
    copyTarget(POSTER_ID, "https://example.com/preview", DEPLOY_STORE);
    copyTarget(POSTER_ID, "https://example.com/production");

    const response = await scan(POSTER_ID, { deployContext: "deploy-preview" });

    expect(response.headers.get("Location")).toBe(
      "https://example.com/preview",
    );
  });
});

describe("scanning a poster whose target isn't copied", () => {
  it("redirects to the target in the database, and copies it", async () => {
    const response = await scan(POSTER_ID);

    expect(response.status).toBe(307);
    expect(response.headers.get("Location")).toBe(TARGET);
    expect(targetQueries()[0].values).toEqual([POSTER_ID]);
    expect(copiedTarget(POSTER_ID)).toBe(TARGET);
    expect(inserts()).toHaveLength(1);
  });

  it("doesn't overwrite a target the app copied meanwhile", async () => {
    // The owner changed the target after the database was read.
    answer = (query) => {
      if (isTargetQuery(query)) {
        copyTarget(POSTER_ID, "https://example.com/newer");
        return [{ target: "https://example.com/older" }];
      }
      return [];
    };

    await scan(POSTER_ID);

    expect(copiedTarget(POSTER_ID)).toBe("https://example.com/newer");
  });

  it("falls back to the database if the copy can't be read", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    blobs.failReads = true;

    const response = await scan(POSTER_ID);

    expect(response.headers.get("Location")).toBe(TARGET);
    expect(error).toHaveBeenCalledWith(
      `Couldn't read the copied target of poster ${POSTER_ID}`,
      expect.any(Error),
    );
  });

  it("still redirects and records the scan if the target can't be copied", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    blobs.failWrites = true;

    const response = await scan(POSTER_ID);

    expect(response.headers.get("Location")).toBe(TARGET);
    expect(inserts()).toHaveLength(1);
    expect(error).toHaveBeenCalledWith(
      `Couldn't copy the target of poster ${POSTER_ID}`,
      expect.any(Error),
    );
  });
});

describe("recording a scan", () => {
  beforeEach(() => {
    copyTarget(POSTER_ID, TARGET);
  });

  it("skips the scan quietly if the poster was deleted since the redirect", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    // How the driver reports it: the Postgres error wrapped in another.
    answer = () => {
      throw new Error("Query failed", { cause: { code: "23503" } });
    };

    const response = await scan(POSTER_ID);

    expect(response.status).toBe(307);
    expect(error).not.toHaveBeenCalled();
  });

  it("logs a scan that can't be recorded, still redirecting", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    answer = () => {
      throw new Error("Connection lost");
    };

    const response = await scan(POSTER_ID);

    expect(response.status).toBe(307);
    expect(error).toHaveBeenCalledWith(
      `Couldn't record a scan of poster ${POSTER_ID}`,
      expect.any(Error),
    );
  });
});

describe("connecting to the database", () => {
  it("reuses one Neon client across scans", async () => {
    await scan(POSTER_ID);
    await scan(POSTER_ID);
    await scan(POSTER_ID);

    expect(neon).toHaveBeenCalledTimes(1);
    expect(neon).toHaveBeenCalledWith("postgres://neon.example/db");
    expect(inserts()).toHaveLength(3);
  });

  it("connects again when the connection string changes", async () => {
    await scan(POSTER_ID);
    vi.stubEnv("NETLIFY_DB_URL", "postgres://neon.example/rotated");

    await scan(POSTER_ID);

    expect(neon).toHaveBeenLastCalledWith("postgres://neon.example/rotated");
  });

  it("goes through @netlify/database under netlify dev, whose Postgres Neon's driver can't reach", async () => {
    vi.stubEnv("NETLIFY_DB_DRIVER", "server");

    const response = await scan(POSTER_ID, { deployContext: "dev" });

    expect(response.headers.get("Location")).toBe(TARGET);
    expect(getDatabase).toHaveBeenCalled();
    expect(inserts()).toHaveLength(1);
  });
});

describe("scanning a poster that doesn't exist", () => {
  beforeEach(() => {
    answer = () => [];
  });

  it("shows the poster not found page with a 404, uncached, copying nothing", async () => {
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
    expect(copiedTarget(POSTER_ID)).toBeUndefined();
    expect(inserts()).toHaveLength(0);
  });

  it.each([
    ["a malformed id", "not-a-poster"],
    ["an upper-case UUID", POSTER_ID.toUpperCase()],
  ])(
    "treats %s as not found without reading the copy or querying",
    async (_name, posterId) => {
      const response = await scan(posterId);

      expect(response.status).toBe(404);
      expect(blobs.reads).toBe(0);
      expect(queries).toHaveLength(0);
      expect(blobs.stores.size).toBe(0);
    },
  );

  it("passes on only the headers access protection checks", async () => {
    await scan(POSTER_ID, {
      headers: {
        Cookie: "nf_jwt=token",
        Authorization: "Basic abc",
        "Accept-Encoding": "gzip",
      },
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
    failPage();

    const response = await scan(POSTER_ID);

    expect(response.status).toBe(404);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.text()).toBe("Poster not found");
  });
});

describe("a warm-up ping", () => {
  it("gets a 204 straight away, without reading the copy or querying", async () => {
    const response = await scan("warm-up", { headers: { "X-Warm-Up": "1" } });

    expect(response.status).toBe(204);
    expect(blobs.reads).toBe(0);
    expect(queries).toHaveLength(0);
    expect(neon).not.toHaveBeenCalled();
    expect(fetchPage).not.toHaveBeenCalled();
  });
});
