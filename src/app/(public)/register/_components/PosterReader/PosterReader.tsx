"use client";

import { useState } from "react";

import { ClientScanUrlService } from "@clientApplication/services/ClientScanUrlService";
import type { PosterId } from "@domain/poster/PosterId";

import InvalidPosterDialog from "../InvalidPosterDialog";
import QrCodeReader from "../QrCodeReader";
import ValidPosterDialog from "../ValidPosterDialog";

type ReadResult = { kind: "valid"; posterId: PosterId } | { kind: "invalid" };

// The QR code reader and the dialog each read opens. The reader is off while a
// dialog is open, and any way of closing the dialog starts it again.
export default function PosterReader() {
  const [readResult, setReadResult] = useState<ReadResult | null>(null);

  function handleRead(text: string) {
    // Only this deploy's posters count (ADR-0014), so the origin is this page's.
    const posterId = ClientScanUrlService.parse(text, window.location.origin);
    setReadResult(posterId ? { kind: "valid", posterId } : { kind: "invalid" });
  }

  const close = () => setReadResult(null);

  return (
    <>
      <QrCodeReader disabled={readResult !== null} onRead={handleRead} />
      <ValidPosterDialog open={readResult?.kind === "valid"} onClose={close} />
      <InvalidPosterDialog
        open={readResult?.kind === "invalid"}
        onClose={close}
      />
    </>
  );
}
