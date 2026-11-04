import {
  PosterDesignImageRules,
  type PosterDesignImageType,
} from "@domain/campaign/design/PosterDesignImageRules";
import { ValidationError } from "@domain/shared/ValidationError";

import { readPdfPageCount } from "./readPdfPageCount";

/** What `PosterDesignImageRules` checks about a poster design's image. */
export type PosterDesignImageDetails = {
  /** The file's real format, or `null` if it isn't an allowed one. */
  type: PosterDesignImageType | null;
  size: number;
  /** Only read for a PDF. */
  pageCount?: number;
};

/**
 * Reads what the domain needs to check a poster design's image. The format
 * comes from the file's first bytes, not its own type, which the browser
 * guesses from the file name. Used by both the upload's service and the form,
 * so they check a file the same way.
 *
 * Throws `ValidationError` for a PDF that can't be read. A file over the size
 * limit isn't parsed, as the domain rejects it anyway.
 */
export async function readPosterDesignImage(
  file: Blob,
): Promise<PosterDesignImageDetails> {
  const header = new Uint8Array(
    await file.slice(0, PosterDesignImageRules.HEADER_BYTES).arrayBuffer(),
  );
  const type = PosterDesignImageRules.detectType(header);
  const details = { type, size: file.size };
  if (
    type !== PosterDesignImageRules.PDF_TYPE ||
    file.size > PosterDesignImageRules.MAX_SIZE_BYTES
  ) {
    return details;
  }

  const pageCount = await readPdfPageCount(file);
  if (pageCount === null) {
    throw new ValidationError("This PDF can't be read.");
  }
  return { ...details, pageCount };
}
