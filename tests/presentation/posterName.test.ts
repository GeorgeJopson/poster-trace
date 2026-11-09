import { describe, expect, it } from "vitest";

import { randomPosterName, resolvePosterName } from "@/utils/posterName";

// An adjective then a place, each starting with a capital letter, such as
// "Gentle Swamp" or "Moon-misted Hills".
const ADJECTIVE_THEN_PLACE = /^[A-Z][\w-]* [A-Z][\w-]*$/;

describe("randomPosterName", () => {
  it("is an adjective then a place", () => {
    expect(randomPosterName()).toMatch(ADJECTIVE_THEN_PLACE);
  });

  it.each([0, 0.999999])(
    "is still a full name when the random number is %s",
    (n) => {
      expect(randomPosterName(() => n)).toMatch(ADJECTIVE_THEN_PLACE);
    },
  );

  it("differs from one call to the next", () => {
    const names = new Set(Array.from({ length: 20 }, () => randomPosterName()));
    expect(names.size).toBeGreaterThan(1);
  });
});

describe("resolvePosterName", () => {
  it("is the entered name, without surrounding spaces", () => {
    expect(resolvePosterName("  Bus stop by the bakery ", "Gentle Swamp")).toBe(
      "Bus stop by the bakery",
    );
  });

  it.each(["", "   "])(
    "falls back to the default name when the entered name is %j",
    (entered) => {
      expect(resolvePosterName(entered, "Gentle Swamp")).toBe("Gentle Swamp");
    },
  );
});
