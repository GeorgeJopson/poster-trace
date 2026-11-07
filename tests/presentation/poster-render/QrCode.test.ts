import { describe, expect, it } from "vitest";

import { QrCode } from "@/utils/poster-render/QrCode";

// Short enough for the smallest QR code, 21 modules across, at level Q.
const SHORT_URL = "https://a.b";

describe("QrCode", () => {
  describe("svgPath", () => {
    it("traces the dark modules in module units, centred on the origin", () => {
      // The top row of a QR code starts with its top-left finder pattern:
      // 7 dark modules, then a light one. A 21-module code spans -10.5 to
      // 10.5, so that run is the path's first rectangle.
      const path = new QrCode(SHORT_URL, "Q").svgPath;
      expect(path.startsWith("M-10.5 -10.5h7v1h-7Z")).toBe(true);
    });
  });

  describe("place", () => {
    const page = { width: 1000, height: 1414 };

    it("centres the QR code from its placement's top-left corner, in the page's units", () => {
      // 25% of the width is 250 across, with its top-left corner 10% across
      // (100) and 20% down (282.8), so its centre is 125 further on each way.
      const placed = new QrCode(SHORT_URL, "Q").place(
        { x: 10, y: 20, size: 25, rotation: 0 },
        page,
      );
      expect(placed.centreX).toBeCloseTo(225);
      expect(placed.centreY).toBeCloseTo(407.8);
    });

    it("scales module units so the QR code is `size` percent of the page's width", () => {
      // 250 across, over 21 modules.
      const placed = new QrCode(SHORT_URL, "Q").place(
        { x: 0, y: 0, size: 25, rotation: 0 },
        page,
      );
      expect(placed.scale).toBeCloseTo(250 / 21);
    });

    it("keeps the rotation clockwise, in degrees", () => {
      const placed = new QrCode(SHORT_URL, "Q").place(
        { x: 0, y: 0, size: 25, rotation: 90 },
        page,
      );
      expect(placed.rotation).toBe(90);
    });

    it("is the same size for any URL of the same length, whatever its characters", () => {
      // So a preview's sample scan URL matches every printed poster's. A
      // UUID's runs of digits would otherwise be packed more tightly.
      const placement = { x: 0, y: 0, size: 25, rotation: 0 };
      const digits = new QrCode(
        "http://localhost:3000/redirect/00000000-0000-0000-0000-000000000000",
        "Q",
      ).place(placement, page);
      const letters = new QrCode(
        "http://localhost:3000/redirect/abcdefab-cdef-4abc-adef-abcdefabcdef",
        "Q",
      ).place(placement, page);
      expect(digits.scale).toBe(letters.scale);
    });

    it("uses smaller modules at a higher error correction level", () => {
      // More error correction needs more modules for the same URL, so each
      // is smaller within the same size.
      const url = "https://www.postertrace.app/redirect/0";
      const placement = { x: 0, y: 0, size: 25, rotation: 0 };
      const low = new QrCode(url, "L").place(placement, page);
      const high = new QrCode(url, "H").place(placement, page);
      expect(high.scale).toBeLessThan(low.scale);
    });
  });
});
