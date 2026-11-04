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
