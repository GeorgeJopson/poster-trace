import { PDFDocument } from "pdf-lib";

/**
 * How many pages the PDF has, or `null` if it can't be read (it's corrupt,
 * encrypted or not a PDF). Browser-safe, so forms can check a picked file
 * before uploading it.
 */
export async function readPdfPageCount(data: Blob): Promise<number | null> {
  try {
    const pdf = await PDFDocument.load(await data.arrayBuffer(), {
      updateMetadata: false,
    });
    return pdf.getPageCount();
  } catch {
    return null;
  }
}
