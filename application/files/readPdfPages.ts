import { PDFDocument } from "pdf-lib";

import type { PageSize } from "@domain/campaign/design/PosterDesignImageRules";

/**
 * How many pages the PDF has, and its first page's size (its CropBox, the part
 * that's shown) and /Rotate, in degrees from 0 to 270. `null` if it can't be
 * read (it's corrupt, encrypted or not a PDF).
 */
export async function readPdfPages(data: Blob): Promise<{
  pageCount: number;
  pageSize?: PageSize;
  pageRotation?: number;
} | null> {
  try {
    const pdf = await PDFDocument.load(await data.arrayBuffer(), {
      updateMetadata: false,
    });
    const pageCount = pdf.getPageCount();
    if (pageCount === 0) return { pageCount };
    const page = pdf.getPage(0);
    const { width, height } = page.getCropBox();
    return {
      pageCount,
      pageSize: { width, height },
      pageRotation: ((page.getRotation().angle % 360) + 360) % 360,
    };
  } catch {
    return null;
  }
}
