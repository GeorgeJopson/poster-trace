import "server-only";

import type { UserRepository } from "@domain/user/UserRepository";

import { requireUserId } from "../auth/requireUserId";
import type { CurrentUserDto } from "../dto/CurrentUserDto";
import type { AccountGateway } from "../ports/AccountGateway";
import type { SessionProvider } from "../ports/SessionProvider";

/** The signed-in user's account. */
export class AccountService {
  constructor(
    private readonly sessions: SessionProvider,
    private readonly users: UserRepository,
    private readonly accountGateway: AccountGateway,
  ) {}

  async getCurrentUser(): Promise<CurrentUserDto> {
    const userId = await requireUserId(this.sessions);
    const user = await this.users.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    return { name: user.name, email: user.email };
  }

  /** Throws `NotAuthenticatedError` if no one is signed in. */
  async requireCurrentUserId(): Promise<void> {
    await requireUserId(this.sessions);
  }

  /**
   * Deletes the signed-in user, which deletes their campaigns and designs
   * too. Their images are left for the daily clean-up job (ADR-0013).
   */
  async deleteAccount(): Promise<void> {
    await requireUserId(this.sessions);
    // Throws if the delete is refused.
    await this.accountGateway.deleteCurrentAccount();
  }
}
