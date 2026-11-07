import {
  PosterDesignImageRules,
  type PageSize,
  type PosterDesignImageType,
} from "./PosterDesignImageRules";

/** A poster design's image, on its way into the repository. */
export class PosterDesignImageUpload {
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
    details: {
      type: string | null;
      pageCount?: number;
      pageSize?: PageSize;
      pageRotation?: number;
    },
  ): PosterDesignImageUpload {
    const file = { ...details, size: data.size };
    PosterDesignImageRules.assertValid(file);
    return new PosterDesignImageUpload(data, file.type);
  }
}
