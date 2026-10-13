"use client";

import { useEffect, useRef, useState } from "react";

import type { PosterDesignWithUrl } from "@/data/campaigns";
import usePosterCanvas from "@/utils/usePosterCanvas";

import styles from "./DesignPreview.module.css";

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
 * at the image's natural size and displayed at `width` x `height`. If the
 * image fails to load, a placeholder is shown instead.
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
  const [failed, setFailed] = useState(false);

  const { designUrl } = posterDesign;
  usePosterCanvas(canvasRef, image, posterDesign, url);

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (!cancelled) setImage(img);
    };
    img.onerror = () => {
      if (!cancelled) setFailed(true);
    };
    img.src = designUrl;
    return () => {
      cancelled = true;
    };
  }, [designUrl]);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={ariaLabel}
        style={{ width, height }}
        className={`${styles.unavailable} ${className ?? ""}`}
      >
        Preview unavailable
      </div>
    );
  }

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
