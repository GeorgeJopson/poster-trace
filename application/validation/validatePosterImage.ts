import { PosterDesignImageRules } from "@domain/campaign/design/PosterDesignImageRules";

import { getValidationMessage } from "./getValidationMessage";

/**
 * Why `file` can't be used as a poster design, or `null` if it can. A PDF
 * needs its `pageCount` (see readPdfPageCount).
 */
export function validatePosterImage(file: {
  type: string;
  size: number;
  pageCount?: number;
}): string | null {
  return getValidationMessage(() => PosterDesignImageRules.assertValid(file));
}
