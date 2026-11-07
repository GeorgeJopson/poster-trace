import { describe, expect, it } from "vitest";

import { PosterDesign } from "@domain/campaign/design/PosterDesign";
import { PosterDesignId } from "@domain/campaign/design/PosterDesignId";
import { PosterDesignImage } from "@domain/campaign/design/PosterDesignImage";
import { QrPlacement } from "@domain/campaign/design/QrPlacement";

import { A4_PDF_DETAILS } from "../support/pdfs";

const placement = QrPlacement.create({ x: 1, y: 2, size: 3, rotation: 4 });
const image = PosterDesignImage.create(new Blob(["pdf"]), A4_PDF_DETAILS);

describe("PosterDesign.create", () => {
  it("holds the image it was given", async () => {
    const design = PosterDesign.create(placement, image);

    expect(await design.image()).toBe(image);
  });
});

describe("PosterDesign.restore", () => {
  it("loads its image only when first asked, and only once", async () => {
    let loads = 0;
    const design = PosterDesign.restore({
      id: PosterDesignId.generate(),
      qrPlacement: placement,
      imageLoader: async () => {
        loads++;
        return image;
      },
    });

    expect(loads).toBe(0);
    const [first, second] = await Promise.all([design.image(), design.image()]);
    expect(await design.image()).toBe(image);

    expect(first).toBe(image);
    expect(second).toBe(image);
    expect(loads).toBe(1);
  });

  it("throws if its image is missing", async () => {
    const design = PosterDesign.restore({
      id: PosterDesignId.generate(),
      qrPlacement: placement,
      imageLoader: async () => null,
    });

    await expect(design.image()).rejects.toThrow(
      "Poster design image is missing",
    );
  });
});

describe("PosterDesign.image", () => {
  it("loads again after a failed load", async () => {
    let loads = 0;
    const design = PosterDesign.restore({
      id: PosterDesignId.generate(),
      qrPlacement: placement,
      imageLoader: async () => {
        if (++loads === 1) throw new Error("network error");
        return image;
      },
    });

    // Callers waiting on the failed load all see it fail.
    const results = await Promise.allSettled([design.image(), design.image()]);
    expect(results.map(({ status }) => status)).toEqual([
      "rejected",
      "rejected",
    ]);
    expect(loads).toBe(1);

    expect(await design.image()).toBe(image);
    expect(await design.image()).toBe(image);
    expect(loads).toBe(2);
  });

  it("loads again after finding the image missing", async () => {
    let loads = 0;
    const design = PosterDesign.restore({
      id: PosterDesignId.generate(),
      qrPlacement: placement,
      imageLoader: async () => (++loads === 1 ? null : image),
    });

    await expect(design.image()).rejects.toThrow();
    expect(await design.image()).toBe(image);
  });
});
