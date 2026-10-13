import { RefObject, useLayoutEffect } from "react";

import drawPoster from "@/utils/drawPoster";

export type QrValues = {
  qrXPosition: string;
  qrYPosition: string;
  qrSize: string;
  qrRotation: string;
};

/**
 * Draws the image and QR code onto the canvas (or clears the canvas if there
 * is no image), redrawing whenever any of the values change. A layout effect
 * is used so the canvas updates before the browser paints.
 */
export default function usePosterCanvas(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  image: HTMLImageElement | null,
  qrValues: QrValues,
  target: string,
) {
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
      {
        image,
        qrXPosition: parseFloat(qrValues.qrXPosition) || 0,
        qrYPosition: parseFloat(qrValues.qrYPosition) || 0,
        qrSize: parseFloat(qrValues.qrSize) || 0,
        qrRotation: parseFloat(qrValues.qrRotation) || 0,
      },
      target,
    );
  }, [canvasRef, image, qrValues, target]);
}
