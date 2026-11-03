import type { User } from "./User";
import type { UserId } from "./UserId";

export interface UserRepository {
  findById(id: UserId): Promise<User | null>;
}
