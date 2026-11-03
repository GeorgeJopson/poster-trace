import { PosterDesignImageRules } from "@domain/campaign/design/PosterDesignImageRules";

import { getValidationMessage } from "./getValidationMessage";

/** Why `file` can't be used as a poster design, or `null` if it can. */
export function validatePosterImage(file: {
  type: string;
  size: number;
}): string | null {
  return getValidationMessage(() => PosterDesignImageRules.assertValid(file));
}
