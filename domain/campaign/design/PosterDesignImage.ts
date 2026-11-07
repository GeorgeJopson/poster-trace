import { ValidationError } from "../../shared/ValidationError";
import {
  PosterDesignImageRules,
  type PosterDesignImageDetails,
  type PosterDesignImageType,
} from "./PosterDesignImageRules";

/**
 * A poster design's image: the PDF the QR code is placed on. It never changes
 * once uploaded.
 */
export class PosterDesignImage {
  private constructor(
    readonly data: Blob,
    /** The validated type, which is what gets stored with the image. */
    readonly contentType: PosterDesignImageType,
  ) {}

  /**
   * `type` is the file's real format; the rest is read from the PDF, which
   * must be one unrotated portrait A4 page.
   */
  static create(
    data: Blob,
    details: Omit<PosterDesignImageDetails, "size">,
  ): PosterDesignImage {
    const file = { ...details, size: data.size };
    PosterDesignImageRules.assertValid(file);
    return new PosterDesignImage(data, file.type);
  }

  /**
   * Rebuilds a stored image. Only repositories call this. Its PDF was checked
   * when it was uploaded, so only the stored type is checked again.
   */
  static restore(data: Blob, contentType: string): PosterDesignImage {
    if (!PosterDesignImageRules.isAllowedType(contentType)) {
      throw new ValidationError("Invalid poster design image type");
    }
    return new PosterDesignImage(data, contentType);
  }
}
