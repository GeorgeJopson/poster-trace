/** Account management owned by the authentication provider. */
export interface AccountGateway {
  /**
   * Deletes the signed-in user, which also deletes their sessions, campaigns
   * and designs. Throws `AccountDeletionRefusedError` if the provider refuses,
   * e.g. because the session isn't fresh.
   */
  deleteCurrentAccount(): Promise<void>;
}
