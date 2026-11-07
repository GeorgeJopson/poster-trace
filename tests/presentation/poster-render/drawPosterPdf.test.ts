import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";

import type { PosterDesignImageType } from "@domain/campaign/design/PosterDesignImageRules";
import drawPosterPdf, { A4 } from "@/utils/poster-render/drawPosterPdf";

import { drawnPathPoints, drawnXObject } from "../../support/pdfDrawing";
import { makePdf } from "../../support/pdfs";

const qrPlacement = { x: 10, y: 20, size: 25, rotation: 0 };
const posters = [
  { id: "a", scanUrl: "https://www.postertrace.app/redirect/a" },
  { id: "b", scanUrl: "https://www.postertrace.app/redirect/b" },
  { id: "c", scanUrl: "https://www.postertrace.app/redirect/c" },
];

describe("drawPosterPdf", () => {
  async function drawnPdf(
    data: Uint8Array,
    count = posters.length,
    placement = qrPlacement,
  ) {
    return PDFDocument.load(
      await drawPosterPdf(
        { data, contentType: "application/pdf", qrPlacement: placement },
        posters.slice(0, count),
      ),
    );
  }

  /** The QR code's box on the first page, and where its first module is. */
  async function drawnQrCode(placement: typeof qrPlacement) {
    const points = drawnPathPoints(
      (await drawnPdf(await makePdf(1), 1, placement)).getPage(0),
    );
    const xs = points.map(([x]) => x);
    const ys = points.map(([, y]) => y);
    const [left, right] = [Math.min(...xs), Math.max(...xs)];
    const [bottom, top] = [Math.min(...ys), Math.max(...ys)];
    return {
      left,
      bottom,
      width: right - left,
      height: top - bottom,
      centre: [(left + right) / 2, (bottom + top) / 2],
      // The first point drawn is a corner of the top-left finder pattern.
      firstPoint: points[0],
    };
  }

  it("places the QR code from the page's top-left corner", async () => {
    // 25% of the width (148.82) with its top-left corner at 10% across
    // (59.528) and 20% down (168.378), so its bottom is 841.89 - 168.378 -
    // 148.82 up from the page's bottom.
    const qr = await drawnQrCode({ x: 10, y: 20, size: 25, rotation: 0 });
    expect(qr.left).toBeCloseTo(59.528);
    expect(qr.width).toBeCloseTo(148.82);
    expect(qr.height).toBeCloseTo(148.82);
    expect(qr.bottom).toBeCloseTo(524.692);
  });

  it("keeps the QR code upright, with its first finder pattern top-left", async () => {
    const qr = await drawnQrCode(qrPlacement);
    const [centreX, centreY] = qr.centre;
    expect(qr.firstPoint[0]).toBeLessThan(centreX);
    expect(qr.firstPoint[1]).toBeGreaterThan(centreY);
  });

  it("turns the QR code clockwise, as in the preview", async () => {
    // A quarter turn clockwise takes the top-left corner to the top-right.
    const qr = await drawnQrCode({ ...qrPlacement, rotation: 90 });
    const [centreX, centreY] = qr.centre;
    expect(qr.firstPoint[0]).toBeGreaterThan(centreX);
    expect(qr.firstPoint[1]).toBeGreaterThan(centreY);
  });

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
