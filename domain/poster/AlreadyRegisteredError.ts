/**
 * Thrown when registering a poster that already has a registration: the first
 * registration wins (see ADR-0016). The message is user-facing, and says
 * nothing about the existing registration.
 */
export class AlreadyRegisteredError extends Error {
  constructor(message = "This poster has already been registered.") {
    super(message);
    this.name = "AlreadyRegisteredError";
  }
}
