import { describe, expect, it } from "vitest";

import { QrPlacement } from "@domain/campaign/design/QrPlacement";
import { ValidationError } from "@domain/shared/ValidationError";

const valid = { x: 50, y: 25.5, size: 120, rotation: 90 };

describe("QrPlacement", () => {
  it("keeps valid values", () => {
    const placement = QrPlacement.create(valid);
    expect({ ...placement }).toEqual(valid);
  });

  it("accepts the ends of each range", () => {
    expect(() =>
      QrPlacement.create({ x: 0, y: 0, size: 0, rotation: 0 }),
    ).not.toThrow();
    expect(() =>
      QrPlacement.create({ x: 100, y: 100, size: 10_000, rotation: 360 }),
    ).not.toThrow();
  });

  it.each([
    ["x", -0.1],
    ["x", 100.1],
    ["y", -1],
    ["y", 101],
    ["size", -1],
    ["rotation", -3],
    ["rotation", 361],
    ["x", Number.NaN],
    ["size", Number.POSITIVE_INFINITY],
    ["rotation", Number.NEGATIVE_INFINITY],
  ] as const)("rejects %s = %s", (name, value) => {
    expect(() => QrPlacement.create({ ...valid, [name]: value })).toThrow(
      ValidationError,
    );
  });

  it("exposes each value's range", () => {
    expect(QrPlacement.RANGES.x).toEqual({ min: 0, max: 100, step: 0.1 });
    expect(QrPlacement.RANGES.y).toEqual({ min: 0, max: 100, step: 0.1 });
    expect(QrPlacement.RANGES.size).toEqual({ min: 0, max: Infinity, step: 1 });
    expect(QrPlacement.RANGES.rotation).toEqual({ min: 0, max: 360, step: 1 });
  });
});
