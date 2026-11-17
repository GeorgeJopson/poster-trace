"use client";

import type { PosterCheckDto } from "@application/dto/PosterCheckDto";
import Button from "@/components/Button";
import CentralDialog from "@/components/CentralDialog";

import styles from "./CantRegisterDialog.module.css";

/**
 * Why a poster that was read can't be registered: it isn't a Poster Trace QR
 * code at all, or the server's check says it can't be.
 */
export type CantRegisterReason =
  "invalid" | Exclude<PosterCheckDto, "unregistered">;

const MESSAGES: Record<CantRegisterReason, { title: string; text: string }> = {
  // Decided in the browser: the QR code isn't one of this site's scan URLs.
  invalid: {
    title: "Not a Poster Trace poster",
    text: "This QR code wasn't made by Poster Trace, so there's no poster to register.",
  },
  // A scan URL, but for a poster Poster Trace doesn't have, e.g. because its
  // campaign was deleted.
  unknown: {
    title: "Poster not recognised",
    text: "This QR code looks like a Poster Trace poster's, but Poster Trace doesn't recognise the poster, so there's nothing to register.",
  },
  // Says nothing about the registration, so strangers reading the QR code
  // can't learn the poster's name or location (#40, user story 14).
  registered: {
    title: "Already registered",
    text: "This poster has already been registered, so it can't be registered again.",
  },
};

interface CantRegisterDialogProps {
  // Why the poster that was read can't be registered, while the dialog is open.
  reason: CantRegisterReason | null;
  onClose: () => void;
}

// Opens when a poster that was read can't be registered, either straight after
// the read or when a registration's submit finds out.
export default function CantRegisterDialog({
  reason,
  onClose,
}: CantRegisterDialogProps) {
  const message = reason && MESSAGES[reason];
  return (
    <CentralDialog
      open={reason !== null}
      onOpenChange={(nextOpen) => !nextOpen && onClose()}
      title={message?.title ?? ""}
    >
      {message && <p className={styles.text}>{message.text}</p>}
      <Button variant="filled" fontSize="1.25rem" onClick={onClose}>
        Read a different poster
      </Button>
    </CentralDialog>
  );
}
