"use client";

import { useEffect, useRef, useState } from "react";

import type { PosterDesignDto } from "@application/dto/PosterDesignDto";
import { routeNames } from "@/routeNames";
import loadDesignImage, { type DesignImage } from "@/utils/loadDesignImage";
import usePosterCanvas from "@/utils/usePosterCanvas";

import styles from "./DesignPreview.module.css";

interface DesignPreviewProps {
  width: number;
  height: number;
  posterDesign: PosterDesignDto;
  /** The URL the QR code points to. */
  url: string;
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
  url,
  "aria-label": ariaLabel,
  className,
}: DesignPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<DesignImage | null>(null);
  const [failed, setFailed] = useState(false);

  const designUrl = routeNames.posterDesignImage(posterDesign.id);
  usePosterCanvas(canvasRef, image, posterDesign.qrPlacement, url, {
    width,
    height,
  });

  useEffect(() => {
    let cancelled = false;
    // Fetched rather than loaded into an <img>, as the image may be a PDF.
    // A PDF is rendered big enough to stay sharp when cropped to cover the
    // display size, unless it's more than twice as wide as it is tall.
    fetch(designUrl)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.blob();
      })
      .then((blob) =>
        loadDesignImage(blob, {
          maxWidth: Math.ceil(
            Math.max(width, height * 2) * window.devicePixelRatio,
          ),
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
  }, [designUrl, width, height]);

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
