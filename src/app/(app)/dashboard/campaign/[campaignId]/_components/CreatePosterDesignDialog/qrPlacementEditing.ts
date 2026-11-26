import type { QrPlacementDto } from "@application/dto/PosterDesignDto";
import { QrPlacement } from "@domain/campaign/design/QrPlacement";
import { qrSquare, type PageSize } from "@/utils/poster-render/QrCode";

/**
 * Where a new poster design's QR code starts, and where Reset returns it: in
 * the bottom-right corner, 30% of the page's width wide, with a margin of 5%
 * of the page's width from the right and bottom edges. A portrait A4 page is
 * √2 times as tall as it's wide, so that's y = 100 − (30 + 5) ÷ √2 ≈ 75.3. A
 * page of another shape would need its own y.
 */
export const DEFAULT_QR_PLACEMENT: Readonly<QrPlacementDto> = {
  x: 65,
  y: 75.3,
  size: 30,
  rotation: 0,
};

export function isDefaultQrPlacement(placement: QrPlacementDto): boolean {
  return (
    placement.x === DEFAULT_QR_PLACEMENT.x &&
    placement.y === DEFAULT_QR_PLACEMENT.y &&
    placement.size === DEFAULT_QR_PLACEMENT.size &&
    placement.rotation === DEFAULT_QR_PLACEMENT.rotation
  );
}

/**
 * A point on a poster design's image, as percentages of its width and height
 * from its top-left corner: the same units as a QR placement's `x` and `y`.
 */
export type ImagePoint = { x: number; y: number };

/** The axes a QR code's position is given on. */
type Axis = "x" | "y";

/** Where the pointer grabbed the QR code, relative to its `x` and `y`. */
export type Grab = { offsetX: number; offsetY: number };

/**
 * Grabs the QR code with the pointer at `point`, or returns `null` if the
 * point isn't on it. The whole square counts, light modules included, turned
 * with the code's rotation.
 */
export function grabQrCode(
  point: ImagePoint,
  placement: QrPlacementDto,
  page: PageSize,
): Grab | null {
  const square = qrSquare(placement, page);
  // The point relative to the code's centre, turned back by its rotation, so
  // it can be compared with the unrotated square.
  const dx = (point.x / 100) * page.width - square.centreX;
  const dy = (point.y / 100) * page.height - square.centreY;
  const angle = (-square.rotation * Math.PI) / 180;
  const across = dx * Math.cos(angle) - dy * Math.sin(angle);
  const down = dx * Math.sin(angle) + dy * Math.cos(angle);
  const half = square.side / 2;
  if (Math.abs(across) > half || Math.abs(down) > half) return null;
  return { offsetX: point.x - placement.x, offsetY: point.y - placement.y };
}

/** The QR code's `x` and `y` with the pointer at `point`. */
export function dragQrCode(point: ImagePoint, grab: Grab): ImagePoint {
  return {
    x: toPosition("x", point.x - grab.offsetX),
    y: toPosition("y", point.y - grab.offsetY),
  };
}

export type NudgeDirection = "up" | "down" | "left" | "right";

const NUDGES: Record<NudgeDirection, { axis: Axis; by: number }> = {
  up: { axis: "y", by: -0.25 },
  down: { axis: "y", by: 0.25 },
  left: { axis: "x", by: -0.25 },
  right: { axis: "x", by: 0.25 },
};

/**
 * The placement with the QR code moved 0.25% of the image's width or height in
 * `direction`, stopping at its limit.
 */
export function nudgeQrCode(
  placement: QrPlacementDto,
  direction: NudgeDirection,
): QrPlacementDto {
  const { axis, by } = NUDGES[direction];
  return { ...placement, [axis]: toPosition(axis, placement[axis] + by) };
}

/** Whether the QR code isn't yet at its limit in `direction`. */
export function canNudgeQrCode(
  placement: QrPlacementDto,
  direction: NudgeDirection,
): boolean {
  const { axis, by } = NUDGES[direction];
  const { min, max } = QrPlacement.RANGES[axis];
  return by < 0 ? placement[axis] > min : placement[axis] < max;
}

/**
 * `value` kept within the axis's range and rounded to its step, so it's a
 * value the server accepts.
 */
function toPosition(axis: Axis, value: number): number {
  const { min, max, step } = QrPlacement.RANGES[axis];
  // Divides by a whole number of steps per unit (20), not multiplies by the
  // step (0.05), which isn't exact in binary.
  const stepsPerUnit = 1 / step;
  const rounded = Math.round(value * stepsPerUnit) / stepsPerUnit;
  return Math.min(max, Math.max(min, rounded));
}
