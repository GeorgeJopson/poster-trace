import { headers } from "next/headers";
import { cache } from "react";

import type { SessionProvider } from "@application/ports/SessionProvider";
import { UserId } from "@domain/user/UserId";

import type { BetterAuth } from "./betterAuth";

/** The current request's Better Auth session. */
export class BetterAuthSessionProvider implements SessionProvider {
  // Cached so every layout, page and action in a request shares one lookup.
  private readonly getSession = cache(async () =>
    this.auth.api.getSession({ headers: await headers() }),
  );

  constructor(private readonly auth: BetterAuth) {}

  async getCurrentUserId(): Promise<UserId | null> {
    const session = await this.getSession();
    return session ? UserId.from(session.user.id) : null;
  }
}
