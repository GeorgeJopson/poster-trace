import type { UserId } from "@domain/user/UserId";

import { NotAuthenticatedError } from "../errors/NotAuthenticatedError";
import type { SessionProvider } from "../ports/SessionProvider";

/**
 * The signed-in user's id. Every owner-facing use case calls this first, so a
 * signed-out request always gets `NotAuthenticatedError`, whatever its input.
 */
export async function requireUserId(
  sessions: SessionProvider,
): Promise<UserId> {
  const userId = await sessions.getCurrentUserId();
  if (!userId) {
    throw new NotAuthenticatedError();
  }
  return userId;
}
