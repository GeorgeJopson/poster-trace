import { describe, expect, it } from "vitest";

import { PosterDesignId } from "@domain/campaign/design/PosterDesignId";
import { Poster } from "@domain/poster/Poster";
import { PosterId } from "@domain/poster/PosterId";
import { ScanId } from "@domain/poster/ScanId";
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

describe("Poster.addScan", () => {
  it("records a scan at the given time with its own id", () => {
    const poster = Poster.restore({ id: PosterId.generate(), designId });
    const scannedAt = new Date("2026-11-07T12:00:00Z");

    const scan = poster.addScan(scannedAt);

    expect(scan.scannedAt).toEqual(scannedAt);
    expect(ScanId.parse(scan.id)).toBe(scan.id);
    expect(poster.newScans).toEqual([scan]);
  });

  it("gives every scan its own id", () => {
    const poster = Poster.restore({ id: PosterId.generate(), designId });
    const first = poster.addScan(new Date());
    const second = poster.addScan(new Date());

    expect(first.id).not.toBe(second.id);
    expect(poster.newScans).toEqual([first, second]);
  });

  it("starts with no new scans, whether generated or restored", () => {
    const [generated] = Poster.generate(designId, 1);
    const restored = Poster.restore({ id: PosterId.generate(), designId });

    expect(generated.newScans).toEqual([]);
    expect(restored.newScans).toEqual([]);
  });
});
