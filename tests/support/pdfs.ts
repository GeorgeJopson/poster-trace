import { PDFDocument } from "pdf-lib";

import { PosterDesignImageRules } from "@domain/campaign/design/PosterDesignImageRules";

/** Portrait A4 in PDF points, as `[width, height]`. */
export const A4_SIZE: [number, number] = [
  PosterDesignImageRules.A4.width,
  PosterDesignImageRules.A4.height,
];

/**
 * A PDF with `pageCount` pages of `width` x `height` points (portrait A4 by
 * default), each with a square drawn on it (pdf-lib can't embed a page with no
 * content).
 */
export async function makePdf(
  pageCount = 1,
  [width, height]: [number, number] = A4_SIZE,
): Promise<Uint8Array<ArrayBuffer>> {
  const pdf = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    pdf.addPage([width, height]).drawRectangle({ width: 10, height: 10 });
  }
  return (await pdf.save()) as Uint8Array<ArrayBuffer>;
}

/**
 * What `PosterDesignImage.create` is given for a valid design: a
 * one-page portrait A4 PDF. The bytes themselves aren't parsed there.
 */
export const A4_PDF_DETAILS = {
  type: PosterDesignImageRules.PDF_TYPE,
  pageCount: 1,
  pageSize: PosterDesignImageRules.A4,
  pageRotation: 0,
};
