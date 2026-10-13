import QRCode from "qrcode";

import type { PosterDesign } from "@/db/schema";

export type DrawablePosterDesign = Pick<
  PosterDesign,
  "qrXPosition" | "qrYPosition" | "qrSize" | "qrRotation"
> & {
  image: HTMLImageElement;
};

/**
 * Draws the design image onto ctx's canvas at the image's natural size, with
 * a QR code for `url` on top. The canvas is resized to fit the image.
 */
export default function drawPoster(
  ctx: CanvasRenderingContext2D,
  posterDesign: DrawablePosterDesign,
  url: string,
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
  const modules = QRCode.create(url, { errorCorrectionLevel: "Q" }).modules;
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
