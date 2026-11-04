/** The first bytes of every PNG file. */
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/**
 * Bytes that start like a PNG, followed by `rest`. Enough for the upload
 * checks, which look at a file's first bytes; not a drawable image.
 */
export function pngBytes(rest = "png bytes"): Uint8Array<ArrayBuffer> {
  const tail = new TextEncoder().encode(rest);
  const bytes = new Uint8Array(PNG_SIGNATURE.length + tail.length);
  bytes.set(PNG_SIGNATURE);
  bytes.set(tail, PNG_SIGNATURE.length);
  return bytes;
}
