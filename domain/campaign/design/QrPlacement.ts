import { ValidationError } from "../../shared/ValidationError";

export type QrPlacementFields = {
  x: number;
  y: number;
  size: number;
  rotation: number;
};

/**
 * Where a design's QR code goes on its image: `x` and `y` are the code's
 * top-left corner as a percentage of the image's width and height, `size` is
 * its width as a percentage of the image's width (so it means the same for
 * every format, including PDFs, which have no pixels), and `rotation` is in
 * degrees about its centre.
 */
export class QrPlacement {
  /**
   * Allowed range for each value. On a portrait image, the QR code must also
   * fit the image's height, which only the form knows, so the form lowers
   * `size`'s upper limit to match.
   */
  static readonly RANGES = {
    x: { min: 0, max: 100, step: 0.1 },
    y: { min: 0, max: 100, step: 0.1 },
    size: { min: 0, max: 100, step: 0.1 },
    rotation: { min: 0, max: 360, step: 1 },
  } as const;

  private constructor(
    readonly x: number,
    readonly y: number,
    readonly size: number,
    readonly rotation: number,
  ) {}

  static create(fields: QrPlacementFields): QrPlacement {
    for (const name of Object.keys(
      QrPlacement.RANGES,
    ) as (keyof QrPlacementFields)[]) {
      const { min, max } = QrPlacement.RANGES[name];
      const value = fields[name];
      if (!Number.isFinite(value) || value < min || value > max) {
        throw new ValidationError(`Invalid QR code ${name}`);
      }
    }
    return new QrPlacement(fields.x, fields.y, fields.size, fields.rotation);
  }
}
