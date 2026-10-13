import QRCode from "qrcode";

import type { PosterDesign } from "@/db/schema";

/** Where the QR code goes on the poster; see drawPoster for the units. */
export type QrPlacement = Pick<
  PosterDesign,
  "qrXPosition" | "qrYPosition" | "qrSize" | "qrRotation"
>;

export type DrawablePosterDesign = QrPlacement & {
  image: HTMLImageElement;
};

export type QrModules = ReturnType<typeof QRCode.create>["modules"];

/**
 * Encodes `url` as a QR code. Encoding is relatively slow, so callers should
 * keep the result rather than re-creating it on every draw.
 */
export function createQrModules(url: string): QrModules {
  return QRCode.create(url, { errorCorrectionLevel: "Q" }).modules;
}

/**
 * Draws the design image onto ctx's canvas at the image's natural size, with
 * the QR code on top. The canvas is resized to fit the image.
 */
export default function drawPoster(
  ctx: CanvasRenderingContext2D,
  posterDesign: DrawablePosterDesign,
  modules: QrModules,
) {
  const { image, qrXPosition, qrYPosition, qrSize, qrRotation } = posterDesign;
  const canvas = ctx.canvas;

  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  ctx.drawImage(image, 0, 0);

  // QR code: x/y are the top-left corner as a percentage of the canvas
  // (like CSS left/top), rotated (in degrees) about its centre. Only the
  // dark modules are drawn, so the image shows through the rest. `qrSize`
  // is the code itself, without a quiet zone.
  const x = (qrXPosition / 100) * canvas.width;
  const y = (qrYPosition / 100) * canvas.height;
  const moduleSize = qrSize / modules.size;

  // A single path avoids hairline gaps between adjacent modules.
  ctx.save();
  ctx.translate(x + qrSize / 2, y + qrSize / 2);
  ctx.rotate((qrRotation * Math.PI) / 180);
  ctx.fillStyle = "black";
  ctx.beginPath();
  for (let row = 0; row < modules.size; row++) {
    for (let col = 0; col < modules.size; col++) {
      if (modules.get(row, col)) {
        ctx.rect(
          -qrSize / 2 + col * moduleSize,
          -qrSize / 2 + row * moduleSize,
          moduleSize,
          moduleSize,
        );
      }
    }
  }
  ctx.fill();
  ctx.restore();
}
