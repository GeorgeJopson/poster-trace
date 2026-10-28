import { ValidationError } from "../../shared/ValidationError";

const MAX_SIZE_LABEL = "5 MB";

/** What a poster design's image must be. */
export class PosterDesignImageRules {
  static readonly MAX_SIZE_BYTES = 5 * 1024 * 1024;

  /**
   * Takes the file's type and size rather than a `File`, so the form can
   * check a picked file before uploading it.
   */
  static assertValid(file: { type: string; size: number }): void {
    if (file.size === 0) {
      throw new ValidationError("A poster image is required");
    }
    if (!file.type.startsWith("image/")) {
      throw new ValidationError("Please choose an image file.");
    }
    if (file.size > PosterDesignImageRules.MAX_SIZE_BYTES) {
      throw new ValidationError(`The image must be ${MAX_SIZE_LABEL} or less.`);
    }
  }
}
