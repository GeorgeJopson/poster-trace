import { RefObject, useCallback } from "react";

import { QrValues } from "./PosterDesignFields";

type DrawOverrides = {
  image?: HTMLImageElement | null;
  qrValues?: QrValues;
};

/**
 * Returns a function that draws the image and QR placeholder onto the canvas
 * (or clears the canvas if there is no image). Values passed to the returned
 * function override the ones given to the hook, for when the state hasn't
 * updated yet (e.g. in an onload or a change handler).
 */
export default function useDrawCanvas(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  image: HTMLImageElement | null,
  qrValues: QrValues,
) {
  return useCallback(
    (overrides: DrawOverrides = {}) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      const currentImage =
        overrides.image !== undefined ? overrides.image : image;
      const qr = overrides.qrValues ?? qrValues;

      if (!currentImage) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      canvas.width = currentImage.naturalWidth;
      canvas.height = currentImage.naturalHeight;
      ctx.drawImage(currentImage, 0, 0);

      // Placeholder QR square: x/y is the top-left corner, rotated (in
      // degrees) about its centre.
      const x = parseFloat(qr.qrXPosition) || 0;
      const y = parseFloat(qr.qrYPosition) || 0;
      const size = parseFloat(qr.qrSize) || 0;
      const rotation = parseFloat(qr.qrRotation) || 0;
      ctx.save();
      ctx.translate(x + size / 2, y + size / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.fillStyle = "black";
      ctx.fillRect(-size / 2, -size / 2, size, size);
      ctx.restore();
    },
    [canvasRef, image, qrValues],
  );
}
