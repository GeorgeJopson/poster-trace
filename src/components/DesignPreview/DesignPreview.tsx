"use client";

import { useEffect, useRef, useState } from "react";

import type { PosterDesignDto } from "@application/dto/PosterDesignDto";
import { routeNames } from "@/routeNames";
import loadDesignImage, {
  type DesignImage,
} from "@/utils/poster-render/loadDesignImage";
import usePosterCanvas from "@/utils/poster-render/usePosterCanvas";

import styles from "./DesignPreview.module.css";

interface DesignPreviewProps {
  width: number;
  height: number;
  posterDesign: PosterDesignDto;
  /** The scan URL the QR code encodes. */
  scanUrl: string;
  /** Describes the preview for screen readers, like an image's alt text. */
  "aria-label": string;
  className?: string;
}

/**
 * Renders a poster design with its QR code drawn on top, displayed at
 * `width` x `height`. If the image fails to load, a placeholder is shown
 * instead.
 */
export default function DesignPreview({
  width,
  height,
  posterDesign,
  scanUrl,
  "aria-label": ariaLabel,
  className,
}: DesignPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<DesignImage | null>(null);
  const [failed, setFailed] = useState(false);

  const designUrl = routeNames.posterDesignImage(posterDesign.id);
  usePosterCanvas(canvasRef, image, posterDesign.qrPlacement, scanUrl);

  useEffect(() => {
    let cancelled = false;
    // Fetched rather than loaded into an <img>, as canvases can't draw PDFs.
    // It's rendered at one pixel per physical screen pixel at `width`.
    fetch(designUrl)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.blob();
      })
      .then((blob) =>
        loadDesignImage(blob, {
          maxWidth: Math.ceil(width * window.devicePixelRatio),
        }),
      )
      .then(
        (loaded) => {
          if (!cancelled) setImage(loaded);
        },
        () => {
          if (!cancelled) setFailed(true);
        },
      );
    return () => {
      cancelled = true;
    };
  }, [designUrl, width]);

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
