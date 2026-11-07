import { describe, expect, it } from "vitest";

import { PosterDesignImageRules } from "@domain/campaign/design/PosterDesignImageRules";
import { PosterDesignImage } from "@domain/campaign/design/PosterDesignImage";
import { ValidationError } from "@domain/shared/ValidationError";

const MAX = PosterDesignImageRules.MAX_SIZE_BYTES;
const A4 = PosterDesignImageRules.A4;
/** Millimetres in PDF points. */
const mm = (value: number) => (value * 72) / 25.4;

/** A valid design's details, with `changes` made. */
const pdf = (changes: object = {}) => ({
  type: "application/pdf",
  size: 10,
  pageCount: 1,
  pageSize: A4,
  pageRotation: 0,
  ...changes,
});

describe("PosterDesignImageRules", () => {
  it("accepts a one-page portrait A4 PDF up to 5 MB", () => {
    expect(MAX).toBe(5 * 1024 * 1024);
    expect(() => PosterDesignImageRules.assertValid(pdf())).not.toThrow();
    expect(() =>
      PosterDesignImageRules.assertValid(pdf({ size: MAX })),
    ).not.toThrow();
  });

  it("is A4 at 210 x 297 mm", () => {
    expect(A4.width).toBeCloseTo(595.28);
    expect(A4.height).toBeCloseTo(841.89);
  });

  it.each([
    ["rounded to whole points", { width: 595, height: 842 }],
    [
      "almost 1 mm too big",
      { width: A4.width + mm(0.99), height: A4.height + mm(0.99) },
    ],
    [
      "almost 1 mm too small",
      { width: A4.width - mm(0.99), height: A4.height - mm(0.99) },
    ],
  ])("accepts a page %s", (_case, pageSize) => {
    expect(() =>
      PosterDesignImageRules.assertValid(pdf({ pageSize })),
    ).not.toThrow();
  });

  it.each([
    ["A4 landscape", { width: A4.height, height: A4.width }],
    ["US Letter", { width: 612, height: 792 }],
    ["A3", { width: 841.89, height: 1190.55 }],
    ["1.1 mm too wide", { width: A4.width + mm(1.1), height: A4.height }],
    ["1.1 mm too short", { width: A4.width, height: A4.height - mm(1.1) }],
    ["of unknown size", undefined],
  ])("rejects a page that's %s", (_case, pageSize) => {
    expect(() => PosterDesignImageRules.assertValid(pdf({ pageSize }))).toThrow(
      new ValidationError("The PDF's page must be portrait A4 (210 x 297 mm)."),
    );
  });

  it.each([90, 180, 270, undefined])(
    "rejects a page with a /Rotate of %s",
    (pageRotation) => {
      expect(() =>
        PosterDesignImageRules.assertValid(pdf({ pageRotation })),
      ).toThrow(
        new ValidationError(
          "The PDF's page mustn't be rotated. Please save it without rotation.",
        ),
      );
    },
  );

  it.each([0, 2, undefined])(
    "rejects a PDF with a page count of %s",
    (pageCount) => {
      expect(() =>
        PosterDesignImageRules.assertValid(pdf({ pageCount })),
      ).toThrow(new ValidationError("The PDF must have exactly one page."));
    },
  );

  it.each([
    [pdf({ size: 0 }), "A poster design PDF is required"],
    [
      { type: "application/octet-stream", size: 0 },
      "A poster design PDF is required",
    ],
    [pdf({ type: "image/png" }), "Please choose a PDF."],
    [pdf({ type: "image/jpeg" }), "Please choose a PDF."],
    [pdf({ type: "image/webp" }), "Please choose a PDF."],
    [pdf({ type: "" }), "Please choose a PDF."],
    [pdf({ type: "image/svg+xml" }), "Please choose a PDF."],
    [pdf({ type: null }), "Please choose a PDF."],
    [pdf({ size: MAX + 1 }), "The PDF must be 5 MB or less."],
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
    ["a PDF", bytes("%PDF-1.7\n")],
    ["a PDF with bytes before its header", bytes("junk\n%PDF-1.4")],
  ])("recognises %s from its first bytes", (_case, header) => {
    expect(PosterDesignImageRules.detectType(header)).toBe("application/pdf");
  });

  it.each([
    ["text", bytes("hello")],
    ["a PNG", bytes(0x89, "PNG\r\n\x1a\n", "rest")],
    ["a JPEG", bytes(0xff, 0xd8, 0xff, 0xe0, "rest")],
    ["a GIF", bytes("GIF89a")],
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

describe("PosterDesignImage", () => {
  const details = {
    type: "application/pdf",
    pageCount: 1,
    pageSize: A4,
    pageRotation: 0,
  };

  it("keeps the validated content type, not the blob's own", () => {
    const data = new Blob(["%PDF"], { type: "text/plain" });
    const upload = PosterDesignImage.create(data, details);
    expect(upload.contentType).toBe("application/pdf");
    expect(upload.data).toBe(data);
  });

  it("validates the PDF's page count and size", () => {
    const data = new Blob(["%PDF"]);
    expect(() =>
      PosterDesignImage.create(data, { ...details, pageCount: 2 }),
    ).toThrow("The PDF must have exactly one page.");
    expect(() =>
      PosterDesignImage.create(data, {
        ...details,
        pageSize: { width: 612, height: 792 },
      }),
    ).toThrow("The PDF's page must be portrait A4 (210 x 297 mm).");
  });

  it("validates the content type and size", () => {
    expect(() =>
      PosterDesignImage.create(new Blob(["x"]), {
        ...details,
        type: "image/png",
      }),
    ).toThrow("Please choose a PDF.");
    expect(() => PosterDesignImage.create(new Blob([]), details)).toThrow(
      "A poster design PDF is required",
    );
  });
});

describe("PosterDesignImage.restore", () => {
  it("rebuilds a stored image with its stored type", () => {
    const data = new Blob(["%PDF"]);
    const image = PosterDesignImage.restore(data, "application/pdf");
    expect(image.data).toBe(data);
    expect(image.contentType).toBe("application/pdf");
  });

  it("rejects a stored type that isn't allowed", () => {
    expect(() =>
      PosterDesignImage.restore(new Blob(["x"]), "image/png"),
    ).toThrow(ValidationError);
  });
});
