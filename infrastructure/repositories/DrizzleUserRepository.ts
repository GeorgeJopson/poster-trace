import { User } from "@domain/user/User";
import { UserId } from "@domain/user/UserId";
import type { UserRepository } from "@domain/user/UserRepository";

import type { Db } from "../db/client";

/** Reads users. Better Auth creates and deletes them. */
export class DrizzleUserRepository implements UserRepository {
  constructor(private readonly db: Db) {}

  async findById(id: UserId): Promise<User | null> {
    const row = await this.db.query.user.findFirst({
      where: { id },
      columns: { id: true, name: true, email: true },
    });
    return row ? new User(UserId.from(row.id), row.name, row.email) : null;
  }
}
