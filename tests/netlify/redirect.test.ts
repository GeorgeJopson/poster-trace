import type { Context } from "@netlify/edge-functions";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import redirect from "../../netlify/edge-functions/redirect";

// A stand-in for @netlify/database's client. Each query is recorded as its
// SQL text (with "?" for each value) and its values, and answered by `answer`.
type Query = { text: string; values: unknown[] };
const queries: Query[] = [];
let answer: (query: Query) => unknown[] = () => [];

const { getDatabase } = vi.hoisted(() => ({ getDatabase: vi.fn() }));
vi.mock("@netlify/database", () => ({ getDatabase }));
getDatabase.mockImplementation(() => ({
  sql: async (strings: TemplateStringsArray, ...values: unknown[]) => {
    const query = { text: strings.join("?"), values };
    queries.push(query);
    return answer(query);
  },
}));

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

  it("reuses one database client across scans", async () => {
    await scan(POSTER_ID);
    const opened = getDatabase.mock.calls.length;

    await scan(POSTER_ID);
    await scan(POSTER_ID);

    expect(getDatabase.mock.calls.length).toBe(opened);
    expect(inserts()).toHaveLength(3);
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
