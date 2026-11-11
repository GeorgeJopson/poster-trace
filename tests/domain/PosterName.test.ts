import { describe, expect, it } from "vitest";

import { PosterName } from "@domain/poster/PosterName";
import { ValidationError } from "@domain/shared/ValidationError";

describe("PosterName", () => {
  it("trims the value", () => {
    expect(PosterName.create("  Gentle Swamp \n").value).toBe("Gentle Swamp");
  });

  it("has no length limit", () => {
    const long = "a".repeat(500);
    expect(PosterName.create(long).value).toBe(long);
  });

  it.each([[""], ["   "], ["\n\t"]])("rejects the blank name %j", (raw) => {
    expect(() => PosterName.create(raw)).toThrow(
      new ValidationError("Enter a poster name."),
    );
  });
});
