import { ValidationError } from "../../shared/ValidationError";

const MAX_SIZE_LABEL = "5 MB";

/** What a poster design's image must be. */
export class PosterDesignImageRules {
  static readonly MAX_SIZE_BYTES = 5 * 1024 * 1024;

  static readonly PDF_TYPE = "application/pdf";

  /**
   * The formats posters can be generated from (see ADR-0010). SVG is left out
   * because it can carry scripts.
   */
  static readonly ALLOWED_TYPES: readonly string[] = [
    "image/png",
    "image/jpeg",
    PosterDesignImageRules.PDF_TYPE,
  ];

  /**
   * Takes the file's type and size rather than a `File`, so the form can
   * check a picked file before uploading it. A PDF's `pageCount` is read by
   * the caller, as the domain can't parse PDFs; leaving it out rejects the PDF.
   */
  static assertValid(file: {
    type: string;
    size: number;
    pageCount?: number;
  }): void {
    if (file.size === 0) {
      throw new ValidationError("A poster image is required");
    }
    if (!PosterDesignImageRules.ALLOWED_TYPES.includes(file.type)) {
      throw new ValidationError("Please choose a PNG, JPEG or PDF.");
    }
    if (file.size > PosterDesignImageRules.MAX_SIZE_BYTES) {
      throw new ValidationError(`The image must be ${MAX_SIZE_LABEL} or less.`);
    }
    if (file.type === PosterDesignImageRules.PDF_TYPE && file.pageCount !== 1) {
      throw new ValidationError("The PDF must have exactly one page.");
    }
  }
}
