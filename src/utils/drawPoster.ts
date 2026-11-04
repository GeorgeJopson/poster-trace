import QRCode from "qrcode";

import type { PosterDesignDto } from "@application/dto/PosterDesignDto";

import type { DesignImage } from "./loadDesignImage";

/**
 * The target new campaigns start with, and the one QR codes fall back to for
 * an empty target, as a QR code can't encode an empty string.
 */
export const DEFAULT_TARGET = "https://www.campaigns.com";

/** Where the QR code goes on the poster; see drawPoster for the units. */
export type DrawableQrPlacement = PosterDesignDto["qrPlacement"];

export type DrawablePosterDesign = DrawableQrPlacement & {
  image: DesignImage;
};

export type QrModules = ReturnType<typeof QRCode.create>["modules"];

/**
 * Encodes `url` as a QR code, or DEFAULT_TARGET if `url` is empty. Encoding is
 * relatively slow, so callers should keep the result rather than re-creating
 * it on every draw.
 */
export function createQrModules(url: string): QrModules {
  return QRCode.create(url.trim() || DEFAULT_TARGET, {
    errorCorrectionLevel: "Q",
  }).modules;
}

/** The CSS size a canvas is shown at. */
export type DisplaySize = { width: number; height: number };

/**
 * How much to shrink the image so the canvas has one pixel per physical screen
 * pixel when shown at `displaySize`. The image keeps its aspect ratio and
 * covers the whole box (matching `object-fit: cover`), and is never scaled up.
 */
function getDisplayScale(image: DesignImage, displaySize: DisplaySize) {
  const coverScale = Math.max(
    displaySize.width / image.width,
    displaySize.height / image.height,
  );
  return Math.min(1, coverScale * window.devicePixelRatio);
}

/**
 * Draws the design image onto ctx's canvas with the QR code on top. The canvas
 * is resized to the image's own size or, given a `displaySize`, to just
 * big enough to look sharp at that size. A full-size canvas would hold the
 * whole image in memory (e.g. ~90 MB for 4000 x 5600), which is wasteful for
 * a preview a few hundred pixels across.
 */
export default function drawPoster(
  ctx: CanvasRenderingContext2D,
  posterDesign: DrawablePosterDesign,
  modules: QrModules,
  displaySize?: DisplaySize,
) {
  const {
    image,
    x: xPercent,
    y: yPercent,
    size: sizePercent,
    rotation,
  } = posterDesign;
  const canvas = ctx.canvas;
  const imageWidth = image.width;
  const imageHeight = image.height;
  const scale = displaySize ? getDisplayScale(image, displaySize) : 1;

  // Resizing the canvas also resets the context. Everything below is drawn
  // in the image's own pixels, and the transform scales it to the canvas.
  canvas.width = Math.max(1, Math.round(imageWidth * scale));
  canvas.height = Math.max(1, Math.round(imageHeight * scale));
  ctx.scale(canvas.width / imageWidth, canvas.height / imageHeight);
  // The default smoothing looks grainy when shrinking an image a lot.
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image.source, 0, 0, imageWidth, imageHeight);

  // QR code: x/y are the top-left corner as a percentage of the image
  // (like CSS left/top), rotated (in degrees) about its centre. Only the
  // dark modules are drawn, so the image shows through the rest. `size` is
  // the code's width as a percentage of the image's width, without a quiet
  // zone. drawPosterPdf draws the same placement into poster PDFs.
  const x = (xPercent / 100) * imageWidth;
  const y = (yPercent / 100) * imageHeight;
  const size = (sizePercent / 100) * imageWidth;
  const moduleSize = size / modules.size;

  // A single path avoids hairline gaps between adjacent modules.
  ctx.save();
  ctx.translate(x + size / 2, y + size / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.fillStyle = "black";
  ctx.beginPath();
  for (let row = 0; row < modules.size; row++) {
    for (let col = 0; col < modules.size; col++) {
      if (modules.get(row, col)) {
        ctx.rect(
          -size / 2 + col * moduleSize,
          -size / 2 + row * moduleSize,
          moduleSize,
          moduleSize,
        );
      }
    }
  }
  ctx.fill();
  ctx.restore();
}
