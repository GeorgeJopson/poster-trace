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
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraUnavailable, setCameraUnavailable] = useState(false);
  const handleRead = useEffectEvent(onRead);

  useEffect(() => {
    const video = videoRef.current;
    if (disabled || !video) return;

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

    scanner.start().catch(() => {
      if (!cancelled) setCameraUnavailable(true);
    });

    return () => {
      cancelled = true;
      scanner.destroy();
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

  if (disabled) {
    return <div className={styles.video} aria-hidden />;
  }

  return (
    <video
      ref={videoRef}
      className={styles.video}
      aria-label="Camera view"
      muted
      playsInline
    />
  );
}
