import type { UserId } from "@domain/user/UserId";

/** Who's signed in to the current request. */
export interface SessionProvider {
  /** The signed-in user's id, or `null` if no one is signed in. */
  getCurrentUserId(): Promise<UserId | null>;
}
