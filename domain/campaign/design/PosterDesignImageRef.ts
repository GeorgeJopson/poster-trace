import { ValidationError } from "../../shared/ValidationError";

/**
 * An opaque reference to a stored design image. Infrastructure creates these;
 * the domain only hands them back to the repository, during account deletion.
 */
export type PosterDesignImageRef = string & {
  readonly __brand: "PosterDesignImageRef";
};
export const PosterDesignImageRef = {
  from(value: string): PosterDesignImageRef {
    if (value === "") throw new ValidationError("Invalid poster design image");
    return value as PosterDesignImageRef;
  },
};
