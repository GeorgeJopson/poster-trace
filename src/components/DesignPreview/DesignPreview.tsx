"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { PosterDesignWithUrl } from "@/data/campaigns";
import usePosterCanvas from "@/utils/usePosterCanvas";

interface DesignPreviewProps {
  width: number;
  height: number;
  posterDesign: PosterDesignWithUrl;
  /** The URL the QR code points to. */
  url: string;
  /** Describes the preview for screen readers, like an image's alt text. */
  "aria-label": string;
  className?: string;
}

/**
 * Renders a poster design with its QR code drawn on top. The canvas is drawn
 * at the image's natural size and displayed at `width` x `height`.
 */
export default function DesignPreview({
  width,
  height,
  posterDesign,
  url,
  "aria-label": ariaLabel,
  className,
}: DesignPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  const { designUrl, qrXPosition, qrYPosition, qrSize, qrRotation } =
    posterDesign;
  const qrValues = useMemo(
    () => ({
      qrXPosition: String(qrXPosition),
      qrYPosition: String(qrYPosition),
      qrSize: String(qrSize),
      qrRotation: String(qrRotation),
    }),
    [qrXPosition, qrYPosition, qrSize, qrRotation],
  );
  usePosterCanvas(canvasRef, image, qrValues, url);

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (!cancelled) setImage(img);
    };
    img.src = designUrl;
    return () => {
      cancelled = true;
    };
  }, [designUrl]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={ariaLabel}
      style={{ width, height }}
      className={className}
    />
  );
}
