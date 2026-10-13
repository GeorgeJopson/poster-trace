// Validation rules shared by the form (client side) and @/data/posterDesigns,
// which enforces them on every write, so they can't drift apart. This is kept
// separate from @/data/posterDesigns, as that module is server-only.

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_SIZE_LABEL = "5 MB";

/** Returns why `file` can't be used as a poster design, or null if it can. */
export function getImageFileError(file: File): string | null {
  if (!file.type.startsWith("image/")) {
    return "Please choose an image file.";
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return `The image must be ${MAX_IMAGE_SIZE_LABEL} or less.`;
  }
  return null;
}

/**
 * Allowed range for each QR value. The QR size's upper limit depends on the
 * image (min of its width and height), so it's only enforced by the form.
 */
export const QR_RANGES = {
  qrXPosition: { min: 0, max: 100, step: 0.1 },
  qrYPosition: { min: 0, max: 100, step: 0.1 },
  qrSize: { min: 0, max: Infinity, step: 1 },
  qrRotation: { min: 0, max: 360, step: 1 },
} as const;

export type PosterDesignFields = {
  image: File;
  qrXPosition: number;
  qrYPosition: number;
  qrSize: number;
  qrRotation: number;
};

/**
 * Checks a poster design's fields before they're saved, throwing if they
 * aren't valid.
 */
export function validatePosterDesignFields(data: PosterDesignFields) {
  if (data.image.size === 0) {
    throw new Error("A poster image is required");
  }
  const imageError = getImageFileError(data.image);
  if (imageError) {
    throw new Error(imageError);
  }
  for (const name of Object.keys(QR_RANGES) as (keyof typeof QR_RANGES)[]) {
    const { min, max } = QR_RANGES[name];
    const value = data[name];
    if (!Number.isFinite(value) || value < min || value > max) {
      throw new Error(`Invalid ${name}`);
    }
  }
}
