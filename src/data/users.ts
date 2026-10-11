import "server-only";

import db from "@/db";
import { requireUserId } from "@/auth/session";

export async function getCurrentUser() {
  const userId = await requireUserId();
  const user = await db.query.user.findFirst({
    where: { id: userId },
    columns: { name: true, email: true },
  });
  if (!user) {
    throw new Error("User not found");
  }
  return user;
}
