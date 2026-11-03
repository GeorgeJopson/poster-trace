import { PosterDesignImageRules } from "./PosterDesignImageRules";

/** A poster design's image, on its way into the repository. */
export class PosterDesignImageUpload {
  private constructor(
    readonly data: Blob,
    /** The validated type, which is what gets stored with the image. */
    readonly contentType: string,
  ) {}

  static create(data: Blob, contentType: string): PosterDesignImageUpload {
    PosterDesignImageRules.assertValid({ type: contentType, size: data.size });
    return new PosterDesignImageUpload(data, contentType);
  }
}
