import {
  PosterDesignImageRules,
  type PosterDesignImageType,
} from "./PosterDesignImageRules";

/** A poster design's image, on its way into the repository. */
export class PosterDesignImageUpload {
  private constructor(
    readonly data: Blob,
    /** The validated type, which is what gets stored with the image. */
    readonly contentType: PosterDesignImageType,
  ) {}

  /** `pageCount` is required for a PDF, which must have exactly one page. */
  static create(
    data: Blob,
    contentType: string | null,
    pageCount?: number,
  ): PosterDesignImageUpload {
    const file = { type: contentType, size: data.size, pageCount };
    PosterDesignImageRules.assertValid(file);
    return new PosterDesignImageUpload(data, file.type);
  }
}
