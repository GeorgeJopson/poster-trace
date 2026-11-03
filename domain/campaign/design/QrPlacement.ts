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
 * its width in image pixels, and `rotation` is in degrees about its centre.
 */
export class QrPlacement {
  /**
   * Allowed range for each value. The upper limit of `size` depends on the
   * image (the smaller of its width and height), so it's only enforced by the
   * form.
   */
  static readonly RANGES = {
    x: { min: 0, max: 100, step: 0.1 },
    y: { min: 0, max: 100, step: 0.1 },
    size: { min: 0, max: Infinity, step: 1 },
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
