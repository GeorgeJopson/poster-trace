import { RefObject, useCallback } from "react";

/**
 * Returns a function that draws `image` onto the canvas (or clears the canvas
 * if there is no image). Pass an image to the returned function to draw that
 * one instead, for when the state hasn't updated yet (e.g. in an onload).
 */
export default function useDrawCanvas(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  image: HTMLImageElement | null,
) {
  return useCallback(
    (imageOverride: HTMLImageElement | null = image) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      if (!imageOverride) {
        canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }
      canvas.width = imageOverride.naturalWidth;
      canvas.height = imageOverride.naturalHeight;
      canvas.getContext("2d")?.drawImage(imageOverride, 0, 0);
    },
    [canvasRef, image],
  );
}
