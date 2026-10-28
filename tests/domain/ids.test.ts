import { describe, expect, it } from "vitest";

import { CampaignId } from "@domain/campaign/CampaignId";
import { PosterDesignId } from "@domain/campaign/design/PosterDesignId";
import { ValidationError } from "@domain/shared/ValidationError";
import { UserId } from "@domain/user/UserId";

const UUID = "3f2b8c1e-5d4a-4e6f-9a7b-1c2d3e4f5a6b";

describe.each([
  ["CampaignId", CampaignId],
  ["PosterDesignId", PosterDesignId],
])("%s", (_name, Id) => {
  it("generates distinct UUIDs", () => {
    const a = Id.generate();
    const b = Id.generate();
    expect(Id.parse(a)).toBe(a);
    expect(a).not.toBe(b);
  });

  it("accepts UUIDs", () => {
    expect(Id.from(UUID)).toBe(UUID);
    expect(Id.parse(UUID)).toBe(UUID);
  });

  it.each([
    "",
    "1",
    "42",
    "not-a-uuid",
    `${UUID}x`,
    ` ${UUID}`,
    UUID.toUpperCase(),
  ])("rejects %j", (raw) => {
    expect(Id.parse(raw)).toBeNull();
    expect(() => Id.from(raw)).toThrow(ValidationError);
  });
});

describe("UserId", () => {
  it("wraps Better Auth's ids, which aren't UUIDs", () => {
    expect(UserId.from("aBc123XyZ")).toBe("aBc123XyZ");
  });

  it("rejects empty ids", () => {
    expect(() => UserId.from("")).toThrow(ValidationError);
  });
});
