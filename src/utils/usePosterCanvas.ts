import { RefObject, useLayoutEffect, useMemo } from "react";

import drawPoster, {
  createQrModules,
  type QrPlacement,
} from "@/utils/drawPoster";

/**
 * Draws the image and QR code onto the canvas (or clears the canvas if there
 * is no image), redrawing whenever any of the values change. A layout effect
 * is used so the canvas updates before the browser paints.
 */
export default function usePosterCanvas(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  image: HTMLImageElement | null,
  qrPlacement: QrPlacement,
  target: string,
) {
  const qrModules = useMemo(() => createQrModules(target), [target]);
  // Depend on the individual values, so callers can pass a new object each
  // render without causing a redraw.
  const { qrXPosition, qrYPosition, qrSize, qrRotation } = qrPlacement;

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
      { image, qrXPosition, qrYPosition, qrSize, qrRotation },
      qrModules,
    );
  }, [
    canvasRef,
    image,
    qrXPosition,
    qrYPosition,
    qrSize,
    qrRotation,
    qrModules,
  ]);
}
