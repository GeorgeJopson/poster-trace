import type { SessionProvider } from "@application/ports/SessionProvider";
import { UserId } from "@domain/user/UserId";

export class FakeSessionProvider implements SessionProvider {
  private userId: UserId | null;

  constructor(userId: string | null = null) {
    this.userId = userId === null ? null : UserId.from(userId);
  }

  signInAs(userId: string) {
    this.userId = UserId.from(userId);
  }

  signOut() {
    this.userId = null;
  }

  async getCurrentUserId(): Promise<UserId | null> {
    return this.userId;
  }
}
