"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import QrScanner from "qr-scanner";

import styles from "./QrCodeReader.module.css";

interface QrCodeReaderProps {
  /** Turns the camera off, e.g. while a dialog covers the reader. */
  disabled: boolean;
  /**
   * Called with the text of a QR code it reads. The reader stops after each
   * read, and reads again once it's disabled and re-enabled.
   */
  onRead: (text: string) => void;
}

// Reads QR codes with the device's camera. Reading a code here isn't a scan:
// nothing is recorded and no one is sent to a target.
export default function QrCodeReader({ disabled, onRead }: QrCodeReaderProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [cameraUnavailable, setCameraUnavailable] = useState(false);
  const handleRead = useEffectEvent(onRead);

  useEffect(() => {
    const frame = frameRef.current;
    if (disabled || !frame) return;

    // Each scanner gets its own <video>. A destroyed scanner still clears its
    // video's stream 300ms later, which would abort the next scanner's play()
    // if they shared one (e.g. across React's dev double-mount).
    const video = document.createElement("video");
    video.className = styles.video;
    video.setAttribute("aria-label", "Camera view");
    video.muted = true;
    video.playsInline = true;
    frame.append(video);

    let cancelled = false;
    const scanner = new QrScanner(
      video,
      ({ data }) => {
        // A frame being decoded as the reader is disabled can still finish.
        if (cancelled) return;
        scanner.stop();
        handleRead(data);
      },
      { preferredCamera: "environment", returnDetailedScanResult: true },
    );
    // The scanner reads every frame back from this canvas. A canvas keeps the
    // options of its first getContext() call, so set them before it does.
    scanner.$canvas.getContext("2d", {
      alpha: false,
      willReadFrequently: true,
    });

    scanner.start().catch(() => {
      if (!cancelled) setCameraUnavailable(true);
    });

    return () => {
      cancelled = true;
      // Release the camera now rather than after destroy()'s 300ms delay.
      void scanner.pause(true);
      scanner.destroy();
      // The scanner checks its video's styles on the next frame and warns if
      // it looks hidden, which a detached video does. Remove it after that.
      requestAnimationFrame(() => video.remove());
    };
  }, [disabled]);

  if (cameraUnavailable) {
    return (
      <p role="alert" className={styles.error}>
        Couldn&apos;t access a camera. Check this device has one and that
        you&apos;ve allowed this page to use it.
      </p>
    );
  }

  return <div ref={frameRef} className={styles.frame} />;
}
