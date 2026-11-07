import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";

import type { PosterDesignImageType } from "@domain/campaign/design/PosterDesignImageRules";
import drawPosterPdf, { A4, layoutQrCode } from "@/utils/drawPosterPdf";

import { drawnXObject } from "../support/pdfDrawing";
import { makePdf } from "../support/pdfs";

const qrPlacement = { x: 10, y: 20, size: 25, rotation: 0 };
const posters = [
  { id: "a", scanUrl: "https://www.postertrace.app/redirect/a" },
  { id: "b", scanUrl: "https://www.postertrace.app/redirect/b" },
  { id: "c", scanUrl: "https://www.postertrace.app/redirect/c" },
];

describe("layoutQrCode", () => {
  it("places the QR code from the top-left, as a share of the page", () => {
    // 25% of the width (148.82) with its top-left corner at 10% across
    // (59.528) and 20% down (168.378), so its centre is 59.528 + 74.41
    // across and 841.89 - 168.378 - 74.41 up from the bottom.
    const qr = layoutQrCode({ x: 10, y: 20, size: 25, rotation: 0 });
    expect(qr.size).toBeCloseTo(148.82);
    expect(qr.centreX).toBeCloseTo(133.938);
    expect(qr.centreY).toBeCloseTo(599.102);
  });

  it("turns the QR code clockwise, as in the preview", () => {
    // PDF angles go anticlockwise, so a clockwise turn is negative.
    expect(layoutQrCode({ ...qrPlacement, rotation: 90 }).rotation).toBe(-90);
    expect(layoutQrCode(qrPlacement).rotation).toBe(0);
  });
});

describe("drawPosterPdf", () => {
  async function drawnPdf(data: Uint8Array, count = posters.length) {
    return PDFDocument.load(
      await drawPosterPdf(
        { data, contentType: "application/pdf", qrPlacement },
        posters.slice(0, count),
      ),
    );
  }

  it("makes one A4 page per poster", async () => {
    const pdf = await drawnPdf(await makePdf(1));
    expect(pdf.getPageCount()).toBe(3);
    for (const page of pdf.getPages()) {
      expect(page.getSize()).toEqual({ width: A4.width, height: A4.height });
    }
  });

  it("fills the page with the design", async () => {
    const box = drawnXObject((await drawnPdf(await makePdf(1), 1)).getPage(0));
    expect(box.left).toBeCloseTo(0);
    expect(box.bottom).toBeCloseTo(0);
    expect(box.width).toBeCloseTo(A4.width);
    expect(box.height).toBeCloseTo(A4.height);
  });

  it("only shows the design page's CropBox", async () => {
    // An A3 page cropped to A4 in its middle: the crop fills the poster.
    const source = await PDFDocument.create();
    const page = source.addPage([A4.width * 2, A4.height * 2]);
    page.drawRectangle({ width: 10, height: 10 });
    page.setCropBox(100, 200, A4.width, A4.height);
    const box = drawnXObject(
      (await drawnPdf(await source.save(), 1)).getPage(0),
    );
    expect(box.width).toBeCloseTo(A4.width);
    expect(box.height).toBeCloseTo(A4.height);
  });

  it("gives each page a different QR code", async () => {
    const pdf = await drawnPdf(await makePdf(1), 2);
    const [first, second] = pdf
      .getPages()
      .map((page) => page.node.Contents()?.toString());
    expect(first).not.toEqual(second);
  });

  it("rejects a design format it can't embed", async () => {
    await expect(
      drawPosterPdf(
        {
          data: await makePdf(1),
          // As if an unexpected type got past the type checker.
          contentType: "image/png" as PosterDesignImageType,
          qrPlacement,
        },
        posters,
      ),
    ).rejects.toThrow("Can't make posters from a image/png design");
  });
});
