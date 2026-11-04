import { PosterDesignImageRules } from "@domain/campaign/design/PosterDesignImageRules";
import { ValidationError } from "@domain/shared/ValidationError";

import { readPosterDesignImage } from "../files/readPosterDesignImage";

export type PosterImageCheck = {
  /** Why the file can't be used as a poster design, or `null` if it can. */
  error: string | null;
  /** The file's real format, which may differ from the type it was picked as. */
  contentType: string;
};

/** Checks a picked file before it's uploaded as a poster design. */
export async function validatePosterImage(
  file: Blob,
): Promise<PosterImageCheck> {
  let contentType = "";
  try {
    const details = await readPosterDesignImage(file);
    contentType = details.type;
    PosterDesignImageRules.assertValid(details);
    return { error: null, contentType };
  } catch (error) {
    if (error instanceof ValidationError) {
      return { error: error.message, contentType };
    }
    throw error;
  }
}
