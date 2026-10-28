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
      PosterDesignImageRules.assertValid({ type: "image/webp", size: MAX }),
    ).not.toThrow();
  });

  it.each([
    [{ type: "image/png", size: 0 }, "A poster image is required"],
    [
      { type: "application/octet-stream", size: 0 },
      "A poster image is required",
    ],
    [{ type: "application/pdf", size: 10 }, "Please choose an image file."],
    [{ type: "", size: 10 }, "Please choose an image file."],
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
