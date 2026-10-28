import { describe, expect, it } from "vitest";

import { getValidationMessage } from "@application/validation/getValidationMessage";
import { validateCampaignTarget } from "@application/validation/validateCampaignTarget";
import { validatePosterImage } from "@application/validation/validatePosterImage";
import { ValidationError } from "@domain/shared/ValidationError";

describe("getValidationMessage", () => {
  it("returns null when the check passes", () => {
    expect(getValidationMessage(() => "ok")).toBeNull();
  });

  it("returns a ValidationError's message", () => {
    expect(
      getValidationMessage(() => {
        throw new ValidationError("Bad value");
      }),
    ).toBe("Bad value");
  });

  it("rethrows other errors", () => {
    expect(() =>
      getValidationMessage(() => {
        throw new TypeError("Bug");
      }),
    ).toThrow(TypeError);
  });
});

describe("validateCampaignTarget", () => {
  it("passes a valid URL, ignoring surrounding spaces", () => {
    expect(validateCampaignTarget(" https://example.com ")).toBeNull();
  });

  it.each([
    ["", "Please enter a target URL."],
    ["example.com", "Please enter a full URL, starting with https://."],
    [
      "mailto:a@example.com",
      "The target URL must start with http:// or https://.",
    ],
  ])("returns the message for %j", (value, message) => {
    expect(validateCampaignTarget(value)).toBe(message);
  });
});

describe("validatePosterImage", () => {
  it("passes an image", () => {
    expect(validatePosterImage({ type: "image/jpeg", size: 1024 })).toBeNull();
  });

  it.each([
    [{ type: "text/plain", size: 10 }, "Please choose an image file."],
    [
      { type: "image/png", size: 6 * 1024 * 1024 },
      "The image must be 5 MB or less.",
    ],
  ])("returns the message for %j", (file, message) => {
    expect(validatePosterImage(file)).toBe(message);
  });
});
