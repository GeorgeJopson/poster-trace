/**
 * Thrown when the authentication provider refuses to delete the account, for
 * any reason (e.g. the session isn't fresh). The message is user-facing.
 */
export class AccountDeletionRefusedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AccountDeletionRefusedError";
  }
}
