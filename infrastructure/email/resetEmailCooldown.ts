import { lt } from "drizzle-orm";

import { RESET_EMAIL_COOLDOWN_SECONDS } from "../auth/passwordRules";
import type { Db } from "../db/client";
import { passwordResetEmail } from "../db/schema";

/**
 * Claims the right to send `userId` a password reset email at `now`, at most
 * once per RESET_EMAIL_COOLDOWN_SECONDS. Returns whether this request claimed
 * it.
 *
 * Better Auth's rate limit is per IP, so this also caps emails per account.
 * The upsert only writes, and returns a row, if no email was sent in the
 * cooldown, so of several concurrent requests exactly one claims it. Requests
 * that don't claim it don't move the timestamp, so repeated requests can't
 * keep pushing the next email back.
 */
export async function tryClaimResetEmailCooldown(
  db: Db,
  userId: string,
  now: Date,
): Promise<boolean> {
  const claimed = await db
    .insert(passwordResetEmail)
    .values({ userId, sentAt: now })
    .onConflictDoUpdate({
      target: passwordResetEmail.userId,
      set: { sentAt: now },
      setWhere: lt(
        passwordResetEmail.sentAt,
        new Date(now.getTime() - RESET_EMAIL_COOLDOWN_SECONDS * 1000),
      ),
    })
    .returning();
  return claimed.length > 0;
}
