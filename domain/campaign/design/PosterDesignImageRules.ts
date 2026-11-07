import { ValidationError } from "../../shared/ValidationError";

const MAX_SIZE_LABEL = "5 MB";

const PDF_HEADER = "%PDF-";

/** PDF points (1/72 inch) in a millimetre. */
const POINTS_PER_MM = 72 / 25.4;

/** A format a poster design's image can be, as its MIME type. */
export type PosterDesignImageType =
  (typeof PosterDesignImageRules.ALLOWED_TYPES)[number];

/** A page's size in PDF points: its CropBox, the part that's shown. */
export type PageSize = { width: number; height: number };

/**
 * What `PosterDesignImageRules` checks about a poster design's image. The
 * domain can't parse PDFs, so the caller reads these from the file.
 */
export type PosterDesignImageDetails = {
  /** The file's real format, from its first bytes; `null` if it isn't a PDF. */
  type: string | null;
  size: number;
  pageCount?: number;
  /** The first page's CropBox size. */
  pageSize?: PageSize;
  /** The first page's /Rotate, in degrees. */
  pageRotation?: number;
};

/** What a poster design's image must be. */
export class PosterDesignImageRules {
  static readonly MAX_SIZE_BYTES = 5 * 1024 * 1024;

  static readonly PDF_TYPE = "application/pdf";

  /**
   * The only format accepted: a one-page, portrait A4 PDF (see ADR-0011), so
   * a design prints at its own size and quality.
   */
  static readonly ALLOWED_TYPES = [PosterDesignImageRules.PDF_TYPE] as const;

  /** Portrait A4, 210 x 297 mm, in PDF points. */
  static readonly A4: PageSize = {
    width: 210 * POINTS_PER_MM,
    height: 297 * POINTS_PER_MM,
  };

  /** How far each side may be from A4's, for rounding by the tool that made it. */
  static readonly A4_TOLERANCE = 1 * POINTS_PER_MM;

  static isAllowedType(type: string | null): type is PosterDesignImageType {
    return (
      PosterDesignImageRules.ALLOWED_TYPES as readonly unknown[]
    ).includes(type);
  }

  static isA4(size: PageSize): boolean {
    const { A4, A4_TOLERANCE } = PosterDesignImageRules;
    return (
      Math.abs(size.width - A4.width) <= A4_TOLERANCE &&
      Math.abs(size.height - A4.height) <= A4_TOLERANCE
    );
  }

  /** How many of a file's first bytes `detectType` needs. */
  static readonly HEADER_BYTES = 1024;

  /**
   * Which allowed format a file is, from its first bytes, or `null` if it
   * isn't one. A file's own type comes from the browser, which guesses it from
   * the file name, so this is what decides how a design is stored and served.
   */
  static detectType(header: Uint8Array): PosterDesignImageType | null {
    // PDF readers accept the header anywhere in the first 1024 bytes.
    const start = new TextDecoder("latin1").decode(
      header.subarray(0, PosterDesignImageRules.HEADER_BYTES),
    );
    if (start.includes(PDF_HEADER)) return PosterDesignImageRules.PDF_TYPE;
    return null;
  }

  /**
   * Takes the file's details rather than a `File`, so the form can check a
   * picked file before uploading it. `pageCount`, and the first page's
   * `pageSize` and `pageRotation` (its /Rotate, in degrees), are read by the
   * caller, as the domain can't parse PDFs; leaving any out rejects the file.
   * A `null` type is a file that isn't a PDF.
   *
   * The page mustn't be rotated, so a design is always drawn upright as it's
   * stored, with nothing to turn.
   */
  static assertValid(file: PosterDesignImageDetails): asserts file is {
    type: PosterDesignImageType;
    size: number;
    pageCount: number;
    pageSize: PageSize;
    pageRotation: 0;
  } {
    if (file.size === 0) {
      throw new ValidationError("A poster design PDF is required");
    }
    if (!PosterDesignImageRules.isAllowedType(file.type)) {
      throw new ValidationError("Please choose a PDF.");
    }
    if (file.size > PosterDesignImageRules.MAX_SIZE_BYTES) {
      throw new ValidationError(`The PDF must be ${MAX_SIZE_LABEL} or less.`);
    }
    if (file.pageCount !== 1) {
      throw new ValidationError("The PDF must have exactly one page.");
    }
    if (!file.pageSize || !PosterDesignImageRules.isA4(file.pageSize)) {
      throw new ValidationError(
        "The PDF's page must be portrait A4 (210 x 297 mm).",
      );
    }
    if (file.pageRotation !== 0) {
      throw new ValidationError(
        "The PDF's page mustn't be rotated. Please save it without rotation.",
      );
    }
  }
}
