import { getDb } from "@infrastructure/db/client";
import { user } from "@infrastructure/db/schema";

export const db = getDb();

/** Deletes every user, which cascades to all of their data. */
export async function clearDatabase() {
  await db.delete(user);
}

export async function insertUser(id: string) {
  await db.insert(user).values({
    id,
    name: `User ${id}`,
    email: `${id}@example.com`,
  });
}
