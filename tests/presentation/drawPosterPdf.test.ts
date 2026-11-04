import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";

import drawPosterPdf, { A4, layoutPoster } from "@/utils/drawPosterPdf";

import { makePdf } from "../support/pdfs";

// A 1 x 1 PNG and JPEG.
const PNG = Uint8Array.from(
  atob(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==",
  ),
  (c) => c.charCodeAt(0),
);
const JPEG = Uint8Array.from(
  atob(
    "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=",
  ),
  (c) => c.charCodeAt(0),
);

const qrPlacement = { x: 10, y: 20, size: 25, rotation: 0 };
const posters = [
  { id: "a", redirectUrl: "https://www.postertrace.app/redirect/a" },
  { id: "b", redirectUrl: "https://www.postertrace.app/redirect/b" },
  { id: "c", redirectUrl: "https://www.postertrace.app/redirect/c" },
];

describe("layoutPoster", () => {
  it("fills the page with a design that's A4-shaped", () => {
    const layout = layoutPoster(
      { width: 1190.56, height: 1683.78 },
      { x: 0, y: 0, size: 10, rotation: 0 },
    );
    expect(layout.design.x).toBeCloseTo(0);
    expect(layout.design.y).toBeCloseTo(0);
    expect(layout.design.width).toBeCloseTo(A4.width);
    expect(layout.design.height).toBeCloseTo(A4.height);
  });

  it("centres a wide design, leaving margins above and below", () => {
    // 1000 x 500 scales to the page's width: 595.28 x 297.64.
    const { design } = layoutPoster(
      { width: 1000, height: 500 },
      { x: 0, y: 0, size: 10, rotation: 0 },
    );
    expect(design.width).toBeCloseTo(595.28);
    expect(design.height).toBeCloseTo(297.64);
    expect(design.x).toBeCloseTo(0);
    expect(design.y).toBeCloseTo((841.89 - 297.64) / 2);
  });

  it("centres a tall design, leaving margins either side, scaling it up", () => {
    // 100 x 400 scales to the page's height: 210.4725 x 841.89.
    const { design } = layoutPoster(
      { width: 100, height: 400 },
      { x: 0, y: 0, size: 10, rotation: 0 },
    );
    expect(design.height).toBeCloseTo(841.89);
    expect(design.width).toBeCloseTo(210.4725);
    expect(design.x).toBeCloseTo((595.28 - 210.4725) / 2);
    expect(design.y).toBeCloseTo(0);
  });

  it("places the QR code from the top-left, as a share of the design", () => {
    // A wide design at 595.28 x 297.64, 272.125 from the bottom of the page.
    // The QR code is 25% of the width (148.82) with its top-left corner at
    // 10% across (59.528) and 20% down (59.528), so its centre is
    // 59.528 + 74.41 across and 297.64 - 59.528 - 74.41 up from the design's
    // bottom edge.
    const { qr } = layoutPoster(
      { width: 1000, height: 500 },
      { x: 10, y: 20, size: 25, rotation: 0 },
    );
    expect(qr.size).toBeCloseTo(148.82);
    expect(qr.centreX).toBeCloseTo(133.938);
    expect(qr.centreY).toBeCloseTo(272.125 + 163.702);
    expect(qr.scale).toBeCloseTo(0.59528);
  });

  it("turns the QR code clockwise, as in the preview", () => {
    // PDF angles go anticlockwise, so a clockwise turn is negative.
    const { qr } = layoutPoster(
      { width: 1000, height: 500 },
      { x: 0, y: 0, size: 10, rotation: 90 },
    );
    expect(qr.rotation).toBe(-90);
  });
});

describe("drawPosterPdf", () => {
  it.each([
    ["PNG", PNG, "image/png"],
    ["JPEG", JPEG, "image/jpeg"],
  ])(
    "makes one A4 page per poster from a %s design",
    async (_name, data, contentType) => {
      const bytes = await drawPosterPdf(
        { data, contentType, qrPlacement },
        posters,
      );
      const pdf = await PDFDocument.load(bytes);
      expect(pdf.getPageCount()).toBe(3);
      for (const page of pdf.getPages()) {
        expect(page.getSize()).toEqual(A4);
      }
    },
  );

  it("makes one A4 page per poster from a PDF design", async () => {
    const bytes = await drawPosterPdf(
      {
        data: await makePdf(1, [300, 300]),
        contentType: "application/pdf",
        qrPlacement,
      },
      posters,
    );
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBe(3);
    expect(pdf.getPage(0).getSize()).toEqual(A4);
  });

  it("gives each page a different QR code", async () => {
    const bytes = await drawPosterPdf(
      { data: PNG, contentType: "image/png", qrPlacement },
      posters.slice(0, 2),
    );
    const pdf = await PDFDocument.load(bytes);
    const [first, second] = pdf
      .getPages()
      .map((page) => page.node.Contents()?.toString());
    expect(first).not.toEqual(second);
  });

  it("rejects a design format it can't embed", async () => {
    await expect(
      drawPosterPdf(
        { data: PNG, contentType: "image/webp", qrPlacement },
        posters,
      ),
    ).rejects.toThrow("Can't make posters from a image/webp design");
  });
});
