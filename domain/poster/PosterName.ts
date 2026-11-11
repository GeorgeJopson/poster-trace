import { ValidationError } from "../shared/ValidationError";

/**
 * A memorable name given to a poster when it's registered. It isn't an
 * identifier, so two posters can share one.
 */
export class PosterName {
  private constructor(readonly value: string) {}

  /** Trims `raw` and checks it isn't blank. */
  static create(raw: string): PosterName {
    const value = raw.trim();
    if (value === "") {
      throw new ValidationError("Enter a poster name.");
    }
    return new PosterName(value);
  }
}
