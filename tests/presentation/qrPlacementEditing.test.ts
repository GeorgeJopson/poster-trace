import { describe, expect, it } from "vitest";

import {
  canNudgeQrCode,
  DEFAULT_QR_PLACEMENT,
  isDefaultQrPlacement,
  dragQrCode,
  grabQrCode,
  nudgeQrCode,
} from "@/app/(app)/dashboard/campaign/[campaignId]/_components/CreatePosterDesignDialog/qrPlacementEditing";

// Portrait A4's proportions.
const PAGE = { width: 1000, height: 1414 };

describe("grabQrCode", () => {
  // 250 across and 250 down in page units: x 10% to 35% of the width, and
  // y 20% to 37.68% of the height.
  const placement = { x: 10, y: 20, size: 25, rotation: 0 };

  it("grabs the QR code at the pointer's offset from its top-left corner", () => {
    const grab = grabQrCode({ x: 20, y: 30 }, placement, PAGE);
    expect(grab?.offsetX).toBeCloseTo(10);
    expect(grab?.offsetY).toBeCloseTo(10);
  });

  it("grabs a light part of the code as well as a dark one", () => {
    // The light column beside the top-left finder pattern: the eighth of 21
    // modules across, in the top row.
    expect(grabQrCode({ x: 18.9, y: 20.4 }, placement, PAGE)).not.toBeNull();
  });

  it("doesn't grab the code from just outside it", () => {
    expect(grabQrCode({ x: 35.5, y: 30 }, placement, PAGE)).toBeNull();
    expect(grabQrCode({ x: 20, y: 38 }, placement, PAGE)).toBeNull();
    expect(grabQrCode({ x: 9.5, y: 30 }, placement, PAGE)).toBeNull();
    expect(grabQrCode({ x: 20, y: 19.5 }, placement, PAGE)).toBeNull();
  });

  describe("rotated", () => {
    // Turned 45° about its centre, (225, 407.8) in page units, so its corners
    // point up, down, left and right, 176.8 from the centre.
    const rotated = { ...placement, rotation: 45 };

    it("doesn't grab where its unrotated corner would be", () => {
      // 5 in from the unrotated top-left corner, (100, 282.8).
      expect(grabQrCode({ x: 10.5, y: 20.35 }, rotated, PAGE)).toBeNull();
    });

    it("grabs where its rotated corner is", () => {
      // 170 straight up from the centre, above the unrotated square.
      const grab = grabQrCode({ x: 22.5, y: 16.82 }, rotated, PAGE);
      expect(grab?.offsetX).toBeCloseTo(12.5);
      expect(grab?.offsetY).toBeCloseTo(-3.18);
    });
  });
});

describe("dragQrCode", () => {
  it("keeps the QR code at the same offset from the pointer as when it was grabbed", () => {
    // Grabbed 5% right of and 3% below its top-left corner.
    const grab = { offsetX: 5, offsetY: 3 };
    expect(dragQrCode({ x: 50, y: 40 }, grab)).toEqual({ x: 45, y: 37 });
  });

  it("rounds the position to one decimal place, QR placement's step", () => {
    const grab = { offsetX: 0.01, offsetY: 0 };
    expect(dragQrCode({ x: 33.333, y: 66.666 }, grab)).toEqual({
      x: 33.3,
      y: 66.7,
    });
  });

  it("stops at QR placement's limits when the pointer goes past them", () => {
    const grab = { offsetX: 10, offsetY: 10 };
    expect(dragQrCode({ x: 5, y: 130 }, grab)).toEqual({ x: 0, y: 100 });
  });
});

describe("nudgeQrCode", () => {
  const placement = { x: 75, y: 82.3, size: 20, rotation: 0 };

  it("moves the QR code exactly 1% in the direction given", () => {
    expect(nudgeQrCode(placement, "up")).toEqual({ ...placement, y: 81.3 });
    expect(nudgeQrCode(placement, "down")).toEqual({ ...placement, y: 83.3 });
    expect(nudgeQrCode(placement, "left")).toEqual({ ...placement, x: 74 });
    expect(nudgeQrCode(placement, "right")).toEqual({ ...placement, x: 76 });
  });

  it("stops at QR placement's limits", () => {
    const nearEdges = { ...placement, x: 99.5, y: 0.4 };
    expect(nudgeQrCode(nearEdges, "right")).toEqual({ ...nearEdges, x: 100 });
    expect(nudgeQrCode(nearEdges, "up")).toEqual({ ...nearEdges, y: 0 });
  });
});

describe("canNudgeQrCode", () => {
  it("can't move the QR code further towards a limit it's at", () => {
    const atLimits = { x: 100, y: 0, size: 20, rotation: 0 };
    expect(canNudgeQrCode(atLimits, "right")).toBe(false);
    expect(canNudgeQrCode(atLimits, "up")).toBe(false);
    expect(canNudgeQrCode(atLimits, "left")).toBe(true);
    expect(canNudgeQrCode(atLimits, "down")).toBe(true);
  });

  it("can move a QR code that's short of its limits", () => {
    const short = { x: 0.1, y: 99.9, size: 20, rotation: 0 };
    expect(canNudgeQrCode(short, "left")).toBe(true);
    expect(canNudgeQrCode(short, "down")).toBe(true);
  });
});

describe("DEFAULT_QR_PLACEMENT", () => {
  // A4 in millimetres. 5% of its width is 10.5mm.
  const a4 = { width: 210, height: 297 };

  it("puts an unrotated QR code in the bottom-right corner, 5% of the width from both edges", () => {
    const { x, y, size, rotation } = DEFAULT_QR_PLACEMENT;
    const side = (size / 100) * a4.width;
    expect(rotation).toBe(0);
    expect((x / 100) * a4.width + side).toBeCloseTo(210 - 10.5);
    // To within y's step: 0.1% of the height is 0.3mm.
    expect((y / 100) * a4.height + side).toBeCloseTo(297 - 10.5, 0);
  });

  it("is 20% of the page's width, so it can be seen", () => {
    expect(DEFAULT_QR_PLACEMENT.size).toBe(20);
  });
});

describe("isDefaultQrPlacement", () => {
  it("is true only when every value matches the default", () => {
    expect(isDefaultQrPlacement({ ...DEFAULT_QR_PLACEMENT })).toBe(true);
    for (const key of ["x", "y", "size", "rotation"] as const) {
      expect(
        isDefaultQrPlacement({
          ...DEFAULT_QR_PLACEMENT,
          [key]: DEFAULT_QR_PLACEMENT[key] + 1,
        }),
      ).toBe(false);
    }
  });
});
