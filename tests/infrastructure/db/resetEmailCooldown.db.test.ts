import { beforeEach, describe, expect, it } from "vitest";

import { RESET_EMAIL_COOLDOWN_SECONDS } from "@infrastructure/auth/passwordRules";
import { passwordResetEmail } from "@infrastructure/db/schema";
import { tryClaimResetEmailCooldown } from "@infrastructure/email/resetEmailCooldown";

import { clearDatabase, db, insertUser } from "./testDb";

const start = new Date("2026-01-01T12:00:00.000Z");

function secondsAfterStart(seconds: number) {
  return new Date(start.getTime() + seconds * 1000);
}

async function sentAt() {
  const [row] = await db.select().from(passwordResetEmail);
  return row?.sentAt.getTime();
}

beforeEach(async () => {
  await clearDatabase();
  await insertUser("alice");
});

describe("tryClaimResetEmailCooldown", () => {
  it("lets exactly one of several concurrent requests claim the send", async () => {
    const claims = await Promise.all(
      Array.from({ length: 8 }, () =>
        tryClaimResetEmailCooldown(db, "alice", start),
      ),
    );
    expect(claims.filter(Boolean)).toHaveLength(1);
  });

  it("refuses during the cooldown without moving the timestamp", async () => {
    expect(await tryClaimResetEmailCooldown(db, "alice", start)).toBe(true);

    const duringCooldown = secondsAfterStart(RESET_EMAIL_COOLDOWN_SECONDS - 1);
    expect(await tryClaimResetEmailCooldown(db, "alice", duringCooldown)).toBe(
      false,
    );
    expect(await sentAt()).toBe(start.getTime());

    const afterCooldown = secondsAfterStart(RESET_EMAIL_COOLDOWN_SECONDS + 1);
    expect(await tryClaimResetEmailCooldown(db, "alice", afterCooldown)).toBe(
      true,
    );
    expect(await sentAt()).toBe(afterCooldown.getTime());
  });
});
