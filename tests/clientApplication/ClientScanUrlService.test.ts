import { describe, expect, it } from "vitest";

import { ClientScanUrlService } from "@clientApplication/services/ClientScanUrlService";
import { PosterId } from "@domain/poster/PosterId";

const BASE_URL = "https://postertrace.example";
const POSTER_ID = PosterId.from("6f1c2a4e-8b3d-4f7a-9c2e-1d5b7a9e3f40");
const SCAN_URL = `${BASE_URL}/redirect/${POSTER_ID}`;

describe("ClientScanUrlService", () => {
  describe("build", () => {
    it("gives the poster's scan URL on this site", () => {
      expect(ClientScanUrlService.build(BASE_URL, POSTER_ID)).toBe(
        "https://postertrace.example/redirect/6f1c2a4e-8b3d-4f7a-9c2e-1d5b7a9e3f40",
      );
    });

    it("gives a scan URL that parses back to the same poster", () => {
      const scanUrl = ClientScanUrlService.build(BASE_URL, POSTER_ID);

      expect(ClientScanUrlService.parse(scanUrl, BASE_URL)).toBe(POSTER_ID);
    });
  });

  describe("buildSample", () => {
    it("gives a scan URL for a stand-in poster", () => {
      expect(ClientScanUrlService.buildSample(BASE_URL)).toBe(
        "https://postertrace.example/redirect/00000000-0000-0000-0000-000000000000",
      );
    });
  });

  describe("parse", () => {
    it("gives the poster id from one of this site's scan URLs", () => {
      expect(ClientScanUrlService.parse(SCAN_URL, BASE_URL)).toBe(POSTER_ID);
    });

    it("rejects another site's URL with the same path", () => {
      expect(
        ClientScanUrlService.parse(
          `https://elsewhere.example/redirect/${POSTER_ID}`,
          BASE_URL,
        ),
      ).toBeNull();
    });

    it.each([
      ["a query", `${SCAN_URL}?ref=flyer`],
      ["a hash", `${SCAN_URL}#top`],
      ["an empty query", `${SCAN_URL}?`],
      ["an empty hash", `${SCAN_URL}#`],
      ["a dot segment", `${BASE_URL}/foo/../redirect/${POSTER_ID}`],
      ["a trailing slash", `${SCAN_URL}/`],
      ["an extra path segment", `${SCAN_URL}/more`],
      ["another path", `${BASE_URL}/dashboard`],
      ["an id that isn't a UUID", `${BASE_URL}/redirect/not-a-uuid`],
    ])("rejects a URL with %s", (_, text) => {
      expect(ClientScanUrlService.parse(text, BASE_URL)).toBeNull();
    });

    it("rejects text that isn't a URL", () => {
      expect(ClientScanUrlService.parse("hello, world", BASE_URL)).toBeNull();
    });
  });
});
