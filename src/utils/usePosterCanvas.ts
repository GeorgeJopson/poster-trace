import { RefObject, useLayoutEffect, useMemo } from "react";

import drawPoster, {
  createQrModules,
  type DisplaySize,
  type DrawableQrPlacement,
} from "@/utils/drawPoster";

/**
 * Draws the image and QR code onto the canvas (or clears the canvas if there
 * is no image), redrawing whenever any of the values change. A layout effect
 * is used so the canvas updates before the browser paints. Pass `displaySize`
 * if the canvas is shown smaller than the image (see drawPoster).
 */
export default function usePosterCanvas(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  image: HTMLImageElement | null,
  qrPlacement: DrawableQrPlacement,
  target: string,
  displaySize?: DisplaySize,
) {
  const qrModules = useMemo(() => createQrModules(target), [target]);
  // Depend on the individual values, so callers can pass a new object each
  // render without causing a redraw.
  const { x, y, size, rotation } = qrPlacement;
  const displayWidth = displaySize?.width;
  const displayHeight = displaySize?.height;

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    if (!image) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    drawPoster(
      ctx,
      { image, x, y, size, rotation },
      qrModules,
      displayWidth !== undefined && displayHeight !== undefined
        ? { width: displayWidth, height: displayHeight }
        : undefined,
    );
  }, [
    canvasRef,
    image,
    x,
    y,
    size,
    rotation,
    qrModules,
    displayWidth,
    displayHeight,
  ]);
}
