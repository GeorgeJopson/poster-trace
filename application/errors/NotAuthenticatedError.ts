/** Thrown by owner-facing use cases when no one is signed in. */
export class NotAuthenticatedError extends Error {
  constructor() {
    super("Not signed in");
    this.name = "NotAuthenticatedError";
  }
}
