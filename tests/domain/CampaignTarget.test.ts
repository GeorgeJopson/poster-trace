import { describe, expect, it } from "vitest";

import { CampaignTarget } from "@domain/campaign/CampaignTarget";
import { ValidationError } from "@domain/shared/ValidationError";

describe("CampaignTarget", () => {
  it("accepts http and https URLs", () => {
    expect(CampaignTarget.create("https://example.com/a?b=c").value).toBe(
      "https://example.com/a?b=c",
    );
    expect(CampaignTarget.create("http://example.com").value).toBe(
      "http://example.com",
    );
  });

  it("trims the value", () => {
    expect(CampaignTarget.create("  https://example.com/  ").value).toBe(
      "https://example.com/",
    );
  });

  it.each([
    ["", "Please enter a target URL."],
    ["   ", "Please enter a target URL."],
    ["example.com", "Please enter a full URL, starting with https://."],
    ["not a url", "Please enter a full URL, starting with https://."],
    [
      "javascript:alert(1)",
      "The target URL must start with http:// or https://.",
    ],
    [
      "ftp://example.com",
      "The target URL must start with http:// or https://.",
    ],
    [
      "file:///etc/passwd",
      "The target URL must start with http:// or https://.",
    ],
  ])("rejects %j", (raw, message) => {
    expect(() => CampaignTarget.create(raw)).toThrow(
      new ValidationError(message),
    );
  });

  it("allows up to MAX_LENGTH bytes", () => {
    const base = "https://example.com/";
    const url = base + "a".repeat(CampaignTarget.MAX_LENGTH - base.length);
    expect(CampaignTarget.create(url).value).toBe(url);
    expect(() => CampaignTarget.create(url + "a")).toThrow(/too long/);
  });

  it("counts UTF-8 bytes, not characters", () => {
    const base = "https://example.com/";
    // "é" is two bytes in UTF-8.
    const url =
      base +
      "é".repeat(Math.ceil((CampaignTarget.MAX_LENGTH - base.length) / 2) + 1);
    expect(url.length).toBeLessThan(CampaignTarget.MAX_LENGTH);
    expect(() => CampaignTarget.create(url)).toThrow(ValidationError);
  });
});
