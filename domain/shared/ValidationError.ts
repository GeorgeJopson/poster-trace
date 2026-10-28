/**
 * Thrown when input breaks a domain rule. The message is user-facing, so
 * forms can show it as it is.
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}
