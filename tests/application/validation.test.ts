import { describe, expect, it } from "vitest";

import { getValidationMessage } from "@application/validation/getValidationMessage";
import { validateCampaignTarget } from "@application/validation/validateCampaignTarget";
import { validatePosterDesignImage } from "@application/validation/validatePosterDesignImage";
import { ValidationError } from "@domain/shared/ValidationError";

import { pngBytes } from "../support/images";
import { makePdf } from "../support/pdfs";

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

describe("validatePosterDesignImage", () => {
  const file = (content: BlobPart, type = "") => new Blob([content], { type });

  it("passes an image, giving its format", async () => {
    expect(
      await validatePosterDesignImage(file(pngBytes(), "image/png")),
    ).toEqual({
      error: null,
      contentType: "image/png",
    });
  });

  it("passes a one-page PDF", async () => {
    expect(await validatePosterDesignImage(file(await makePdf(1)))).toEqual({
      error: null,
      contentType: "application/pdf",
    });
  });

  it("gives a file's real format, not the type it was picked as", async () => {
    expect(
      await validatePosterDesignImage(file(await makePdf(1), "image/png")),
    ).toEqual({ error: null, contentType: "application/pdf" });
  });

  it.each([
    ["an empty file", () => file(""), "A poster image is required"],
    [
      "a text file",
      () => file("hello", "text/plain"),
      "Please choose a PNG, JPEG or PDF.",
    ],
    [
      "a text file picked as a PNG",
      () => file("hello", "image/png"),
      "Please choose a PNG, JPEG or PDF.",
    ],
    [
      "an image over 5 MB",
      () => file(pngBytes("x".repeat(5 * 1024 * 1024))),
      "The image must be 5 MB or less.",
    ],
    [
      "an unreadable PDF",
      () => file("%PDF-1.7 garbage"),
      "This PDF can't be read.",
    ],
  ])("returns the message for %s", async (_case, makeFile, message) => {
    expect((await validatePosterDesignImage(makeFile())).error).toBe(message);
  });

  it("returns the message for a PDF with two pages", async () => {
    expect(
      (await validatePosterDesignImage(file(await makePdf(2)))).error,
    ).toBe("The PDF must have exactly one page.");
  });
});
