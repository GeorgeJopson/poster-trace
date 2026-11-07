import { degrees, PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";

import { getValidationMessage } from "@application/validation/getValidationMessage";
import { validateCampaignTarget } from "@application/validation/validateCampaignTarget";
import { validatePosterDesignImage } from "@application/validation/validatePosterDesignImage";
import { ValidationError } from "@domain/shared/ValidationError";

import { A4_SIZE, makePdf } from "../support/pdfs";

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
  // pdf-lib's `save` is typed as possibly holding a shared buffer.
  const file = (content: BlobPart | Uint8Array, type = "") =>
    new Blob([content as BlobPart], { type });
  /** A PNG's first bytes, which is all the format check reads. */
  const png = "\x89PNG\r\n\x1a\npng bytes";

  it("passes a one-page portrait A4 PDF", async () => {
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
    ["an empty file", async () => file(""), "A poster design PDF is required"],
    [
      "a text file",
      async () => file("hello", "text/plain"),
      "Please choose a PDF.",
    ],
    ["a PNG", async () => file(png, "image/png"), "Please choose a PDF."],
    [
      "a PDF over 5 MB",
      async () => file("%PDF-1.7" + "x".repeat(5 * 1024 * 1024)),
      "The PDF must be 5 MB or less.",
    ],
    [
      "an unreadable PDF",
      async () => file("%PDF-1.7 garbage"),
      "This PDF can't be read.",
    ],
    [
      "a PDF with two pages",
      async () => file(await makePdf(2)),
      "The PDF must have exactly one page.",
    ],
    [
      "a US Letter PDF",
      async () => file(await makePdf(1, [612, 792])),
      "The PDF's page must be portrait A4 (210 x 297 mm).",
    ],
    [
      "a landscape A4 PDF",
      async () => file(await makePdf(1, [A4_SIZE[1], A4_SIZE[0]])),
      "The PDF's page must be portrait A4 (210 x 297 mm).",
    ],
    [
      "a portrait A4 page with a /Rotate",
      async () => {
        const pdf = await PDFDocument.create();
        const page = pdf.addPage(A4_SIZE);
        page.drawRectangle({ width: 10, height: 10 });
        page.setRotation(degrees(180));
        return file(await pdf.save());
      },
      "The PDF's page mustn't be rotated. Please save it without rotation.",
    ],
    [
      "a landscape page turned to show as portrait",
      async () => {
        const pdf = await PDFDocument.create();
        const page = pdf.addPage([A4_SIZE[1], A4_SIZE[0]]);
        page.drawRectangle({ width: 10, height: 10 });
        page.setRotation(degrees(90));
        return file(await pdf.save());
      },
      "The PDF's page must be portrait A4 (210 x 297 mm).",
    ],
    [
      "an A4 page cropped smaller",
      async () => {
        const pdf = await PDFDocument.create();
        const page = pdf.addPage(A4_SIZE);
        page.drawRectangle({ width: 10, height: 10 });
        page.setCropBox(0, 0, 400, 600);
        return file(await pdf.save());
      },
      "The PDF's page must be portrait A4 (210 x 297 mm).",
    ],
  ])("returns the message for %s", async (_case, makeFile, message) => {
    expect((await validatePosterDesignImage(await makeFile())).error).toBe(
      message,
    );
  });
});
