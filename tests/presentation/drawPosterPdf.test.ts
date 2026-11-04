import { degrees, PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";

import type { PosterDesignImageType } from "@domain/campaign/design/PosterDesignImageRules";
import drawPosterPdf, { A4, layoutPoster } from "@/utils/drawPosterPdf";

import { drawnXObject, type DrawnXObject } from "../support/pdfDrawing";
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

/**
 * A grayscale JPEG `width` x `height` pixels (up to 8 x 8, one block of the
 * 1 x 1 JPEG's data), with an EXIF orientation tag. Orientation 6 means the
 * camera was turned: viewers rotate it 90° clockwise to show it upright.
 */
function orientedJpeg(width: number, height: number, orientation: number) {
  const exif = [
    ...[0xff, 0xe1, 0x00, 0x22],
    ...[0x45, 0x78, 0x69, 0x66, 0x00, 0x00], // "Exif\0\0"
    ...[0x4d, 0x4d, 0x00, 0x2a, 0x00, 0x00, 0x00, 0x08], // Big-endian TIFF
    ...[0x00, 0x01], // One IFD entry:
    ...[0x01, 0x12, 0x00, 0x03, 0x00, 0x00, 0x00, 0x01], // Orientation, SHORT
    ...[0x00, orientation, 0x00, 0x00],
    ...[0x00, 0x00, 0x00, 0x00], // No next IFD
  ];
  const jpeg = Uint8Array.from([
    ...JPEG.subarray(0, 2),
    ...exif,
    ...JPEG.subarray(2),
  ]);
  // The start-of-frame marker (baseline or, in this file, progressive) is
  // followed by length, precision, height and width.
  const sof = jpeg.findIndex(
    (byte, i) => byte === 0xff && [0xc0, 0xc2].includes(jpeg[i + 1]),
  );
  jpeg[sof + 5] = 0;
  jpeg[sof + 6] = height;
  jpeg[sof + 7] = 0;
  jpeg[sof + 8] = width;
  return jpeg;
}

const qrPlacement = { x: 10, y: 20, size: 25, rotation: 0 };
const posters = [
  { id: "a", scanUrl: "https://www.postertrace.app/redirect/a" },
  { id: "b", scanUrl: "https://www.postertrace.app/redirect/b" },
  { id: "c", scanUrl: "https://www.postertrace.app/redirect/c" },
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
  ] as const)(
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
        {
          data: PNG,
          // As if an unexpected type got past the type checker.
          contentType: "image/webp" as PosterDesignImageType,
          qrPlacement,
        },
        posters,
      ),
    ).rejects.toThrow("Can't make posters from a image/webp design");
  });
});

// The preview (loadDesignImage) shows a design as a browser does, so the
// printed design must match it: same shape, same part of the file, the same
// way up. Otherwise the QR code lands somewhere other than where it was placed.
describe("drawPosterPdf prints the design as the preview shows it", () => {
  async function drawnDesign(design: Parameters<typeof drawPosterPdf>[0]) {
    const pdf = await PDFDocument.load(
      await drawPosterPdf(design, posters.slice(0, 1)),
    );
    return drawnXObject(pdf.getPage(0));
  }

  /** Which corner of the drawn box a page point is at. */
  function cornerOf(box: DrawnXObject, [x, y]: readonly [number, number]) {
    const horizontal = x - box.left < box.width / 2 ? "left" : "right";
    const vertical = y - box.bottom < box.height / 2 ? "bottom" : "top";
    return `${vertical}-${horizontal}`;
  }

  // Orientation, then where the stored top-left and top-right corners show.
  it.each([
    [1, "top-left", "top-right"],
    [2, "top-right", "top-left"],
    [3, "bottom-right", "bottom-left"],
    [4, "bottom-left", "bottom-right"],
    [5, "top-left", "bottom-left"],
    [6, "top-right", "bottom-right"],
    [7, "bottom-right", "top-right"],
    [8, "bottom-left", "top-left"],
  ])(
    "shows a JPEG with EXIF orientation %i as browsers do",
    async (orientation, topLeft, topRight) => {
      const box = await drawnDesign({
        data: orientedJpeg(2, 1, orientation),
        contentType: "image/jpeg",
        qrPlacement,
      });
      expect(cornerOf(box, box.pointAt(0, 1))).toBe(topLeft);
      expect(cornerOf(box, box.pointAt(1, 1))).toBe(topRight);
    },
  );

  it.each([
    [90, "top-right"],
    [180, "bottom-right"],
    [270, "bottom-left"],
  ])("turns a PDF page with /Rotate %i clockwise", async (rotation, corner) => {
    const source = await PDFDocument.create();
    source.addPage([300, 600]).drawRectangle({ width: 10, height: 10 });
    source.getPage(0).setRotation(degrees(rotation));
    const box = await drawnDesign({
      data: await source.save(),
      contentType: "application/pdf",
      qrPlacement,
    });
    expect(cornerOf(box, box.pointAt(0, 1))).toBe(corner);
  });

  it("turns a JPEG upright using its EXIF orientation", async () => {
    // Stored 2 x 1, so it's shown 1 x 2 (portrait) once turned.
    const box = await drawnDesign({
      data: orientedJpeg(2, 1, 6),
      contentType: "image/jpeg",
      qrPlacement,
    });
    expect(box.width / box.height).toBeCloseTo(0.5);
  });

  it("applies a PDF page's /Rotate", async () => {
    // A 300 x 600 page rotated 90° is shown landscape, 600 x 300.
    const source = await PDFDocument.create();
    source.addPage([300, 600]).drawRectangle({ width: 10, height: 10 });
    source.getPage(0).setRotation(degrees(90));
    const box = await drawnDesign({
      data: await source.save(),
      contentType: "application/pdf",
      qrPlacement,
    });
    expect(box.width / box.height).toBeCloseTo(2);
  });

  it("only shows a PDF page's CropBox", async () => {
    // A 600 x 800 page cropped to its bottom 600 x 400 is shown landscape.
    const source = await PDFDocument.create();
    const page = source.addPage([600, 800]);
    page.drawRectangle({ width: 10, height: 10 });
    page.setCropBox(0, 0, 600, 400);
    const box = await drawnDesign({
      data: await source.save(),
      contentType: "application/pdf",
      qrPlacement,
    });
    expect(box.width / box.height).toBeCloseTo(1.5);
  });

  it("draws an upright design at the shape it's shown (control)", async () => {
    // Checks the measuring itself: a plain 300 x 600 page stays portrait.
    const box = await drawnDesign({
      data: await makePdf(1, [300, 600]),
      contentType: "application/pdf",
      qrPlacement,
    });
    expect(box.width / box.height).toBeCloseTo(0.5);
    expect(box.height).toBeCloseTo(A4.height);
  });
});
