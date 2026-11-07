import { PDFDocument } from "pdf-lib";

import {
  PosterDesignImageRules,
  type PosterDesignImageDetails,
} from "@domain/campaign/design/PosterDesignImageRules";
import { ValidationError } from "@domain/shared/ValidationError";

/**
 * Reads what the domain needs to check a poster design's image. The format
 * comes from the file's first bytes, not its own type, which the browser
 * guesses from the file name. Used by both the upload's service and the form,
 * so they check a file the same way.
 *
 * For a PDF, also reads how many pages it has, and its first page's size (its
 * CropBox, the part that's shown) and /Rotate, in degrees from 0 to 270.
 *
 * Throws `ValidationError` for a PDF that can't be read (it's corrupt or
 * encrypted). A file over the size limit isn't parsed, as the domain rejects
 * it anyway.
 */
export async function getPosterDesignImageDetails(
  file: Blob,
): Promise<PosterDesignImageDetails> {
  const details = await getFileDetails(file);
  if (!isValidPdf(details)) return details;

  return { ...details, ...(await getPdfImageDetails(file)) };
}

type FileDetails = Pick<PosterDesignImageDetails, "type" | "size">;

/** The file's real format, from its first bytes, and its size. */
async function getFileDetails(file: Blob): Promise<FileDetails> {
  const header = new Uint8Array(
    await file.slice(0, PosterDesignImageRules.HEADER_BYTES).arrayBuffer(),
  );
  return { type: PosterDesignImageRules.detectType(header), size: file.size };
}

/** Whether the file is a PDF within the size limit, so worth parsing. */
function isValidPdf({ type, size }: FileDetails): boolean {
  return (
    type === PosterDesignImageRules.PDF_TYPE &&
    size <= PosterDesignImageRules.MAX_SIZE_BYTES
  );
}

/**
 * How many pages the PDF has, and its first page's size and /Rotate. Throws
 * `ValidationError` if it can't be read.
 */
async function getPdfImageDetails(
  file: Blob,
): Promise<
  Pick<PosterDesignImageDetails, "pageCount" | "pageSize" | "pageRotation">
> {
  try {
    const pdf = await PDFDocument.load(await file.arrayBuffer(), {
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
    throw new ValidationError("This PDF can't be read.");
  }
}
