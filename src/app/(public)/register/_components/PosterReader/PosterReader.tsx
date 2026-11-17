"use client";

import { useState, useTransition } from "react";

import { ClientScanUrlService } from "@clientApplication/services/ClientScanUrlService";
import type { PosterId } from "@domain/poster/PosterId";

import { checkPoster } from "../../actions";
import CantRegisterDialog, {
  type CantRegisterReason,
} from "../CantRegisterDialog";
import QrCodeReader from "../QrCodeReader";
import ValidPosterDialog from "../ValidPosterDialog";

type ReadResult =
  | { kind: "unregistered"; posterId: PosterId }
  | { kind: "cantRegister"; reason: CantRegisterReason };

// The QR code reader and the dialog each read opens. The reader is off while
// the poster is checked and while a dialog is open, and any way of closing the
// dialog starts it again.
export default function PosterReader() {
  const [readResult, setReadResult] = useState<ReadResult | null>(null);
  const [isChecking, startChecking] = useTransition();

  function handleRead(text: string) {
    // Only this deploy's posters count (ADR-0014), so the origin is this page's.
    const posterId = ClientScanUrlService.parse(text, window.location.origin);
    if (!posterId) {
      setReadResult({ kind: "cantRegister", reason: "invalid" });
      return;
    }
    startChecking(async () => {
      const check = await checkPoster(posterId);
      setReadResult(
        check === "unregistered"
          ? { kind: "unregistered", posterId }
          : { kind: "cantRegister", reason: check },
      );
    });
  }

  const close = () => setReadResult(null);

  return (
    <>
      <QrCodeReader
        disabled={isChecking || readResult !== null}
        onRead={handleRead}
      />
      <ValidPosterDialog
        posterId={
          readResult?.kind === "unregistered" ? readResult.posterId : null
        }
        onClose={close}
        onCantRegister={(reason) =>
          setReadResult({ kind: "cantRegister", reason })
        }
      />
      <CantRegisterDialog
        reason={readResult?.kind === "cantRegister" ? readResult.reason : null}
        onClose={close}
      />
    </>
  );
}
