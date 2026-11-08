"use client";

import { useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";

import Button from "@/components/Button";

import styles from "./QrCodeReader.module.css";

type ReaderState =
  | { state: "reading" }
  | { state: "read"; text: string }
  | { state: "cameraUnavailable" };

// Reads one QR code with the device's camera and shows the text it holds.
// Reading a code here isn't a scan: nothing is recorded and no one is sent
// to a target.
export default function QrCodeReader() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [readerState, setReaderState] = useState<ReaderState>({
    state: "reading",
  });
  const isReading = readerState.state === "reading";

  useEffect(() => {
    const video = videoRef.current;
    if (!isReading || !video) return;

    let cancelled = false;
    const scanner = new QrScanner(
      video,
      ({ data }) => {
        scanner.stop();
        setReaderState({ state: "read", text: data });
      },
      { preferredCamera: "environment", returnDetailedScanResult: true },
    );

    scanner.start().catch(() => {
      if (!cancelled) setReaderState({ state: "cameraUnavailable" });
    });

    return () => {
      cancelled = true;
      scanner.destroy();
    };
  }, [isReading]);

  if (readerState.state === "cameraUnavailable") {
    return (
      <p role="alert" className={styles.error}>
        Couldn&apos;t access a camera. Check this device has one and that
        you&apos;ve allowed this page to use it.
      </p>
    );
  }

  if (readerState.state === "read") {
    return (
      <div className={styles.result}>
        <p className={styles.label}>QR code contents</p>
        <output className={styles.text}>{readerState.text}</output>
        <Button
          variant="filled"
          fontSize="1rem"
          onClick={() => setReaderState({ state: "reading" })}
        >
          Read another
        </Button>
      </div>
    );
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
