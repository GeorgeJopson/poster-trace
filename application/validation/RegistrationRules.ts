import type { RegistrationLocation } from "@domain/poster/Registration";
import { ValidationError } from "@domain/shared/ValidationError";

import type { RegistrationLocationInput } from "../dto/inputs";

/**
 * What a registration's poster name and location must be. These rules are the
 * application's, not the domain's (see #40), so unlike the other validation
 * functions, RegistrationService calls these itself. They're browser-safe, so
 * the registration form reads the same limits.
 */
export const RegistrationRules = {
  POSTER_NAME_MAX_LENGTH: 60,

  /** The poster name trimmed, or a `ValidationError` if it's empty or too long. */
  posterName(value: string): string {
    const posterName = value.trim();
    if (posterName.length === 0) {
      throw new ValidationError("Enter a poster name.");
    }
    if (posterName.length > RegistrationRules.POSTER_NAME_MAX_LENGTH) {
      throw new ValidationError(
        `The poster name can be at most ${RegistrationRules.POSTER_NAME_MAX_LENGTH} characters.`,
      );
    }
    return posterName;
  },

  /**
   * The location, or a `ValidationError` if a value isn't a finite number in
   * range. Accuracy is in metres, so it can't be negative.
   */
  location({
    latitude,
    longitude,
    accuracy,
  }: RegistrationLocationInput): RegistrationLocation {
    const inRange = (value: number, min: number, max: number) =>
      Number.isFinite(value) && value >= min && value <= max;
    if (
      !inRange(latitude, -90, 90) ||
      !inRange(longitude, -180, 180) ||
      !inRange(accuracy, 0, Infinity)
    ) {
      throw new ValidationError(
        "The location isn't valid. Try getting it again, or register without it.",
      );
    }
    return { latitude, longitude, accuracy };
  },
};
