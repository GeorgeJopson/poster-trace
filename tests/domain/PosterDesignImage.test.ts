import { describe, expect, it } from "vitest";

import { PosterDesignImageRef } from "@domain/campaign/design/PosterDesignImageRef";
import { PosterDesignImageRules } from "@domain/campaign/design/PosterDesignImageRules";
import { PosterDesignImageUpload } from "@domain/campaign/design/PosterDesignImageUpload";
import { ValidationError } from "@domain/shared/ValidationError";

const MAX = PosterDesignImageRules.MAX_SIZE_BYTES;

describe("PosterDesignImageRules", () => {
  it("accepts images up to 5 MB", () => {
    expect(MAX).toBe(5 * 1024 * 1024);
    expect(() =>
      PosterDesignImageRules.assertValid({ type: "image/png", size: 1 }),
    ).not.toThrow();
    expect(() =>
      PosterDesignImageRules.assertValid({ type: "image/jpeg", size: MAX }),
    ).not.toThrow();
  });

  it("accepts a one-page PDF", () => {
    expect(() =>
      PosterDesignImageRules.assertValid({
        type: "application/pdf",
        size: 10,
        pageCount: 1,
      }),
    ).not.toThrow();
  });

  it.each([0, 2, undefined])(
    "rejects a PDF with a page count of %s",
    (pageCount) => {
      expect(() =>
        PosterDesignImageRules.assertValid({
          type: "application/pdf",
          size: 10,
          pageCount,
        }),
      ).toThrow(new ValidationError("The PDF must have exactly one page."));
    },
  );

  it.each([
    [{ type: "image/png", size: 0 }, "A poster image is required"],
    [
      { type: "application/octet-stream", size: 0 },
      "A poster image is required",
    ],
    [{ type: "image/webp", size: 10 }, "Please choose a PNG, JPEG or PDF."],
    [{ type: "image/gif", size: 10 }, "Please choose a PNG, JPEG or PDF."],
    [{ type: "", size: 10 }, "Please choose a PNG, JPEG or PDF."],
    [{ type: "image/svg+xml", size: 10 }, "Please choose a PNG, JPEG or PDF."],
    [{ type: "image/jpeg", size: MAX + 1 }, "The image must be 5 MB or less."],
  ])("rejects %j", (file, message) => {
    expect(() => PosterDesignImageRules.assertValid(file)).toThrow(
      new ValidationError(message),
    );
  });
});

describe("PosterDesignImageRules.detectType", () => {
  const bytes = (...values: (number | string)[]) =>
    new Uint8Array(
      values.flatMap((value) =>
        typeof value === "string"
          ? [...value].map((char) => char.charCodeAt(0))
          : [value],
      ),
    );

  it.each([
    ["a PNG", bytes(0x89, "PNG\r\n\x1a\n", "rest"), "image/png"],
    ["a JPEG", bytes(0xff, 0xd8, 0xff, 0xe0, "rest"), "image/jpeg"],
    ["a PDF", bytes("%PDF-1.7\n"), "application/pdf"],
    [
      "a PDF with bytes before its header",
      bytes("junk\n%PDF-1.4"),
      "application/pdf",
    ],
  ])("recognises %s from its first bytes", (_case, header, type) => {
    expect(PosterDesignImageRules.detectType(header)).toBe(type);
  });

  it.each([
    ["text", bytes("hello")],
    ["a GIF", bytes("GIF89a")],
    ["a truncated PNG signature", bytes(0x89, "PNG")],
    ["nothing", bytes()],
  ])("returns null for %s", (_case, header) => {
    expect(PosterDesignImageRules.detectType(header)).toBeNull();
  });

  it("only looks for a PDF header within the first 1024 bytes", () => {
    const late = new Uint8Array(1100);
    late.set(bytes("%PDF-1.7"), 1024);
    expect(PosterDesignImageRules.detectType(late)).toBeNull();
  });
});

describe("PosterDesignImageUpload", () => {
  it("keeps the validated content type, not the blob's own", () => {
    const data = new Blob(["image"], { type: "text/plain" });
    const upload = PosterDesignImageUpload.create(data, "image/png");
    expect(upload.contentType).toBe("image/png");
    expect(upload.data).toBe(data);
  });

  it("validates a PDF's page count", () => {
    const pdf = new Blob(["%PDF"]);
    expect(
      PosterDesignImageUpload.create(pdf, "application/pdf", 1).contentType,
    ).toBe("application/pdf");
    expect(() =>
      PosterDesignImageUpload.create(pdf, "application/pdf", 2),
    ).toThrow("The PDF must have exactly one page.");
  });

  it("validates the content type and size", () => {
    expect(() =>
      PosterDesignImageUpload.create(new Blob(["x"]), "text/plain"),
    ).toThrow(ValidationError);
    expect(() =>
      PosterDesignImageUpload.create(new Blob([]), "image/png"),
    ).toThrow("A poster image is required");
  });
});

describe("PosterDesignImageRef", () => {
  it("wraps a non-empty reference", () => {
    expect(PosterDesignImageRef.from("blob-key")).toBe("blob-key");
    expect(() => PosterDesignImageRef.from("")).toThrow(ValidationError);
  });
});
