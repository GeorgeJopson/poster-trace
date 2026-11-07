import {
  PosterDesignImageRules,
  type PosterDesignImageType,
} from "@domain/campaign/design/PosterDesignImageRules";
import { ValidationError } from "@domain/shared/ValidationError";

import { getPosterDesignImageDetails } from "../files/getPosterDesignImageDetails";

export type PosterDesignImageCheck =
  /** Why the file can't be used as a poster design. */
  | { error: string }
  /**
   * It can be. `contentType` is its real format, which may differ from the
   * type it was picked as.
   */
  | { error: null; contentType: PosterDesignImageType };

/** Checks a picked file before it's uploaded as a poster design. */
export async function validatePosterDesignImage(
  file: Blob,
): Promise<PosterDesignImageCheck> {
  try {
    const details = await getPosterDesignImageDetails(file);
    PosterDesignImageRules.assertValid(details);
    return { error: null, contentType: details.type };
  } catch (error) {
    if (error instanceof ValidationError) return { error: error.message };
    throw error;
  }
}
