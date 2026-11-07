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

    expect(design.image).toBe(image);
    expect(await design.loadImage()).toBe(image);
  });
});

describe("PosterDesign.restore", () => {
  it("has no image until it's loaded", async () => {
    const design = PosterDesign.restore({
      id: PosterDesignId.generate(),
      qrPlacement: placement,
      loadImage: async () => image,
    });

    expect(design.image).toBeUndefined();
    expect(await design.loadImage()).toBe(image);
    expect(design.image).toBe(image);
  });

  it("loads its image only once", async () => {
    let loads = 0;
    const design = PosterDesign.restore({
      id: PosterDesignId.generate(),
      qrPlacement: placement,
      loadImage: async () => {
        loads++;
        return image;
      },
    });

    await Promise.all([design.loadImage(), design.loadImage()]);
    await design.loadImage();

    expect(loads).toBe(1);
  });

  it("throws if its image is missing", async () => {
    const design = PosterDesign.restore({
      id: PosterDesignId.generate(),
      qrPlacement: placement,
      loadImage: async () => null,
    });

    await expect(design.loadImage()).rejects.toThrow(
      "Poster design image is missing",
    );
  });
});
