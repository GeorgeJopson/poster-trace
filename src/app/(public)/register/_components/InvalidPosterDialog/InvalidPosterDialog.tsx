"use client";

import Button from "@/components/Button";
import CentralDialog from "@/components/CentralDialog";

import styles from "./InvalidPosterDialog.module.css";

interface InvalidPosterDialogProps {
  open: boolean;
  onClose: () => void;
}

// Opens when the reader reads a QR code that isn't one of this site's scan
// URLs, so it can't be a poster to register.
export default function InvalidPosterDialog({
  open,
  onClose,
}: InvalidPosterDialogProps) {
  return (
    <CentralDialog
      open={open}
      onOpenChange={(nextOpen) => !nextOpen && onClose()}
      title="Not a Poster Trace poster"
    >
      <p className={styles.text}>
        This QR code wasn&apos;t made by Poster Trace, so there&apos;s no poster
        to register.
      </p>
      <Button variant="filled" fontSize="1.25rem" onClick={onClose}>
        Read a different poster
      </Button>
    </CentralDialog>
  );
}
