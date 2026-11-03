import { beforeEach, describe, expect, it } from "vitest";

import { UserId } from "@domain/user/UserId";
import { DrizzleUserRepository } from "@infrastructure/repositories/DrizzleUserRepository";

import { clearDatabase, db, insertUser } from "./testDb";

beforeEach(async () => {
  await clearDatabase();
  await insertUser("alice");
});

describe("DrizzleUserRepository", () => {
  it("finds a user by id", async () => {
    const user = await new DrizzleUserRepository(db).findById(
      UserId.from("alice"),
    );
    expect(user).toMatchObject({
      id: "alice",
      name: "User alice",
      email: "alice@example.com",
    });
  });

  it("returns null for an unknown user", async () => {
    expect(
      await new DrizzleUserRepository(db).findById(UserId.from("nobody")),
    ).toBeNull();
  });
});
