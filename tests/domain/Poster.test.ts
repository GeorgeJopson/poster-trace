import { describe, expect, it } from "vitest";

import { PosterDesignId } from "@domain/campaign/design/PosterDesignId";
import { Poster } from "@domain/poster/Poster";
import { PosterId } from "@domain/poster/PosterId";
import { ValidationError } from "@domain/shared/ValidationError";

const designId = PosterDesignId.generate();

describe("Poster.generate", () => {
  it("generates the requested number of posters for the design", () => {
    const posters = Poster.generate(designId, 3);

    expect(posters).toHaveLength(3);
    for (const poster of posters) {
      expect(poster.designId).toBe(designId);
      expect(PosterId.parse(poster.id)).toBe(poster.id);
    }
  });

  it("gives every poster its own id", () => {
    const ids = Poster.generate(designId, 50).map((poster) => poster.id);
    expect(new Set(ids).size).toBe(50);
  });

  it.each([0, -1, 2.5, NaN, Infinity])("rejects a count of %s", (count) => {
    expect(() => Poster.generate(designId, count)).toThrow(
      new ValidationError(
        "The number of posters must be a whole number of at least 1.",
      ),
    );
  });
});

describe("Poster.restore", () => {
  it("keeps the stored values", () => {
    const id = PosterId.generate();
    const poster = Poster.restore({ id, designId });
    expect(poster.id).toBe(id);
    expect(poster.designId).toBe(designId);
  });
});
