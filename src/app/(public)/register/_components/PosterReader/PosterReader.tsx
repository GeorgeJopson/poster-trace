"use client";

import { useState, useTransition } from "react";

import { ClientScanUrlService } from "@clientApplication/services/ClientScanUrlService";
import type { PosterId } from "@domain/poster/PosterId";

import { checkPoster } from "../../actions";
import CantRegisterDialog, {
  type CantRegisterReason,
} from "../CantRegisterDialog";
import CheckFailedDialog from "../CheckFailedDialog";
import QrCodeReader from "../QrCodeReader";
import RegisterPosterDialog from "../RegisterPosterDialog";

type ReadResult =
  | { kind: "unregistered"; posterId: PosterId }
  | { kind: "cantRegister"; reason: CantRegisterReason }
  | { kind: "checkFailed"; posterId: PosterId };

// The QR code reader and the dialog each read opens. The reader is off while
// the poster is checked and while a dialog is open, and any way of closing the
// dialog starts it again.
export default function PosterReader() {
  const [readResult, setReadResult] = useState<ReadResult | null>(null);
  const [isChecking, startChecking] = useTransition();

  function check(posterId: PosterId) {
    setReadResult(null);
    startChecking(async () => {
      let result: Awaited<ReturnType<typeof checkPoster>>;
      try {
        result = await checkPoster(posterId);
      } catch {
        // The request failed (e.g. the connection dropped), not the check.
        setReadResult({ kind: "checkFailed", posterId });
        return;
      }
      setReadResult(
        result === "unregistered"
          ? { kind: "unregistered", posterId }
          : { kind: "cantRegister", reason: result },
      );
    });
  }

  function handleRead(text: string) {
    // Only this deploy's posters count (ADR-0014), so the origin is this page's.
    const posterId = ClientScanUrlService.parse(text, window.location.origin);
    if (posterId) {
      check(posterId);
    } else {
      setReadResult({ kind: "cantRegister", reason: "invalid" });
    }
  }

  const close = () => setReadResult(null);

  return (
    <>
      <QrCodeReader
        disabled={isChecking || readResult !== null}
        onRead={handleRead}
      />
      <RegisterPosterDialog
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
      <CheckFailedDialog
        open={readResult?.kind === "checkFailed"}
        onTryAgain={() =>
          readResult?.kind === "checkFailed" && check(readResult.posterId)
        }
        onClose={close}
      />
    </>
  );
}
