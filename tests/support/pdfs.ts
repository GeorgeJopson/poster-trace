import { PDFDocument } from "pdf-lib";

/**
 * A PDF with `pageCount` pages of `width` x `height` points, each with a
 * square drawn on it (pdf-lib can't embed a page with no content).
 */
export async function makePdf(
  pageCount = 1,
  [width, height]: [number, number] = [595.28, 841.89],
): Promise<Uint8Array<ArrayBuffer>> {
  const pdf = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    pdf.addPage([width, height]).drawRectangle({ width: 10, height: 10 });
  }
  return (await pdf.save()) as Uint8Array<ArrayBuffer>;
}
