// Validation rules shared by the form (client side) and the createPosterDesign
// server action, so the two can't drift apart. This can't live in actions.ts,
// as a "use server" file may only export async functions.

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
