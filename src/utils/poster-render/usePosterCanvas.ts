import { RefObject, useLayoutEffect, useMemo } from "react";

import type { QrPlacementDto } from "@application/dto/PosterDesignDto";

import type { DesignImage } from "./loadDesignImage";
import { POSTER_QR_ERROR_CORRECTION, QrCode } from "./QrCode";

/**
 * Draws the design image onto the canvas with the QR code for `scanUrl` on
 * top, or clears the canvas if there's no image yet. It redraws whenever any
 * of the values change, in a layout effect, so the canvas updates before the
 * browser paints. The canvas takes the image's size, so load the image at the
 * size it's shown (see loadDesignImage).
 */
export default function usePosterCanvas(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  image: DesignImage | null,
  qrPlacement: QrPlacementDto,
  scanUrl: string,
) {
  // Encoding is the slow part, so it's only redone when the URL changes.
  const qr = useMemo(
    () => new QrCode(scanUrl, POSTER_QR_ERROR_CORRECTION),
    [scanUrl],
  );
  // Depend on the individual values, so callers can pass a new object each
  // render without causing a redraw.
  const { x, y, size, rotation } = qrPlacement;

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    if (!image) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    // Resizing the canvas also resets the context.
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image.source, 0, 0);

    // Only the dark modules are drawn, so the image shows through the rest.
    const placed = qr.place({ x, y, size, rotation }, image);
    ctx.translate(placed.centreX, placed.centreY);
    ctx.rotate((placed.rotation * Math.PI) / 180);
    ctx.scale(placed.scale, placed.scale);
    ctx.fillStyle = "black";
    ctx.fill(new Path2D(qr.svgPath));
  }, [canvasRef, image, qr, x, y, size, rotation]);
}
