import { ValidationError } from "../../shared/ValidationError";

const MAX_SIZE_LABEL = "5 MB";

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];
const PDF_HEADER = "%PDF-";

/** A format a poster design's image can be, as its MIME type. */
export type PosterDesignImageType =
  (typeof PosterDesignImageRules.ALLOWED_TYPES)[number];

/** What a poster design's image must be. */
export class PosterDesignImageRules {
  static readonly MAX_SIZE_BYTES = 5 * 1024 * 1024;

  static readonly PNG_TYPE = "image/png";
  static readonly JPEG_TYPE = "image/jpeg";
  static readonly PDF_TYPE = "application/pdf";

  /**
   * The formats posters can be generated from (see ADR-0010). SVG is left out
   * because it can carry scripts.
   */
  static readonly ALLOWED_TYPES = [
    PosterDesignImageRules.PNG_TYPE,
    PosterDesignImageRules.JPEG_TYPE,
    PosterDesignImageRules.PDF_TYPE,
  ] as const;

  static isAllowedType(type: string | null): type is PosterDesignImageType {
    return (
      PosterDesignImageRules.ALLOWED_TYPES as readonly unknown[]
    ).includes(type);
  }

  /** How many of a file's first bytes `detectType` needs. */
  static readonly HEADER_BYTES = 1024;

  /**
   * Which allowed format a file is, from its first bytes, or `null` if it
   * isn't one. A file's own type comes from the browser, which guesses it from
   * the file name, so this is what decides how a design is stored and served.
   */
  static detectType(header: Uint8Array): PosterDesignImageType | null {
    const startsWith = (signature: readonly number[]) =>
      signature.every((byte, i) => header[i] === byte);
    if (startsWith(PNG_SIGNATURE)) return PosterDesignImageRules.PNG_TYPE;
    if (startsWith(JPEG_SIGNATURE)) return PosterDesignImageRules.JPEG_TYPE;
    // PDF readers accept the header anywhere in the first 1024 bytes.
    const start = new TextDecoder("latin1").decode(
      header.subarray(0, PosterDesignImageRules.HEADER_BYTES),
    );
    if (start.includes(PDF_HEADER)) return PosterDesignImageRules.PDF_TYPE;
    return null;
  }

  /**
   * Takes the file's type and size rather than a `File`, so the form can
   * check a picked file before uploading it. A PDF's `pageCount` is read by
   * the caller, as the domain can't parse PDFs; leaving it out rejects the PDF.
   * A `null` type is a file that isn't any known format.
   */
  static assertValid(file: {
    type: string | null;
    size: number;
    pageCount?: number;
  }): asserts file is {
    type: PosterDesignImageType;
    size: number;
    pageCount?: number;
  } {
    if (file.size === 0) {
      throw new ValidationError("A poster image is required");
    }
    if (!PosterDesignImageRules.isAllowedType(file.type)) {
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
