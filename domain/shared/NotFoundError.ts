/**
 * Thrown when something doesn't exist, and also when it's owned by someone
 * else, so ids can't be used to probe other users' data.
 */
export class NotFoundError extends Error {
  constructor(message = "Not found") {
    super(message);
    this.name = "NotFoundError";
  }
}
