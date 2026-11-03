import type { UserId } from "./UserId";

/**
 * A signed-up user. Read-only here: Better Auth creates and deletes users.
 */
export class User {
  constructor(
    readonly id: UserId,
    readonly name: string,
    readonly email: string,
  ) {}
}
