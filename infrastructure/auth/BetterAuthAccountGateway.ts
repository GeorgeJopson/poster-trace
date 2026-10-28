import { APIError } from "better-auth/api";
import { headers } from "next/headers";

import { AccountDeletionRefusedError } from "@application/errors/AccountDeletionRefusedError";
import type { AccountGateway } from "@application/ports/AccountGateway";

import type { BetterAuth } from "./betterAuth";

/** Deletes accounts through Better Auth. */
export class BetterAuthAccountGateway implements AccountGateway {
  constructor(private readonly auth: BetterAuth) {}

  async deleteCurrentAccount(): Promise<void> {
    try {
      // Requires a fresh session. The database cascades the delete to the
      // user's sessions, accounts, campaigns, designs, posters and scans.
      await this.auth.api.deleteUser({ body: {}, headers: await headers() });
    } catch (error) {
      // Any refusal (a stale or missing session, or deletion being disabled)
      // is shown to the user.
      if (error instanceof APIError) {
        throw new AccountDeletionRefusedError(error.message);
      }
      throw error;
    }
  }
}
