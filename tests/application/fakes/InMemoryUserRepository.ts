import { User } from "@domain/user/User";
import { UserId } from "@domain/user/UserId";
import type { UserRepository } from "@domain/user/UserRepository";

export class InMemoryUserRepository implements UserRepository {
  readonly users = new Map<UserId, User>();

  add(id: string, name = "Test User", email = `${id}@example.com`) {
    const user = new User(UserId.from(id), name, email);
    this.users.set(user.id, user);
    return user;
  }

  async findById(id: UserId): Promise<User | null> {
    return this.users.get(id) ?? null;
  }
}
