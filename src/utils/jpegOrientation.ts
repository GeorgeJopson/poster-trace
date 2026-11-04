/**
 * How a design's stored content must be turned or flipped to show it upright,
 * as an EXIF orientation: 1 is as stored, 6 is turned 90° clockwise, and so on.
 */
export type Orientation = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

const EXIF_ORIENTATION_TAG = 0x0112;

/**
 * A JPEG's EXIF orientation, which browsers apply when they show it (so the
 * preview does too), or 1 if it has none or it can't be read.
 */
export default function jpegOrientation(data: Uint8Array): Orientation {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  // Segments follow the start-of-image marker until the image data starts.
  let pos = 2;
  while (pos + 4 <= view.byteLength && view.getUint8(pos) === 0xff) {
    const marker = view.getUint8(pos + 1);
    const length = view.getUint16(pos + 2);
    if (marker === 0xda) break;
    if (marker === 0xe1 && isExifHeader(view, pos + 4)) {
      return readOrientation(view, pos + 10) ?? 1;
    }
    pos += 2 + length;
  }
  return 1;
}

function isExifHeader(view: DataView, pos: number) {
  // "Exif\0\0"
  return (
    pos + 6 <= view.byteLength &&
    view.getUint32(pos) === 0x45786966 &&
    view.getUint16(pos + 4) === 0
  );
}

/** Reads the orientation from the TIFF structure starting at `tiff`. */
function readOrientation(view: DataView, tiff: number): Orientation | null {
  try {
    const littleEndian = view.getUint16(tiff) === 0x4949; // "II"
    const ifd = tiff + view.getUint32(tiff + 4, littleEndian);
    const entries = view.getUint16(ifd, littleEndian);
    for (let i = 0; i < entries; i++) {
      const entry = ifd + 2 + i * 12;
      if (view.getUint16(entry, littleEndian) === EXIF_ORIENTATION_TAG) {
        const value = view.getUint16(entry + 8, littleEndian);
        return value >= 1 && value <= 8 ? (value as Orientation) : null;
      }
    }
    return null;
  } catch {
    // A truncated or malformed EXIF block.
    return null;
  }
}
