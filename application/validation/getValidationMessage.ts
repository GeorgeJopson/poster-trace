import { ValidationError } from "@domain/shared/ValidationError";

/**
 * Runs `check`, a domain factory or rule, and returns the message of the
 * `ValidationError` it throws, or `null` if it passes. Other errors are
 * rethrown.
 */
export function getValidationMessage(check: () => unknown): string | null {
  try {
    check();
    return null;
  } catch (error) {
    if (error instanceof ValidationError) {
      return error.message;
    }
    throw error;
  }
}
