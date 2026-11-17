"use client";

import Button from "@/components/Button";
import CentralDialog from "@/components/CentralDialog";

import styles from "./CheckFailedDialog.module.css";

interface CheckFailedDialogProps {
  open: boolean;
  // Checks the same poster with the server again.
  onTryAgain: () => void;
  onClose: () => void;
}

// Opens when the poster that was read couldn't be checked with the server,
// e.g. because the helper's connection dropped, so they're never left stuck.
export default function CheckFailedDialog({
  open,
  onTryAgain,
  onClose,
}: CheckFailedDialogProps) {
  return (
    <CentralDialog
      open={open}
      onOpenChange={(nextOpen) => !nextOpen && onClose()}
      title="Couldn't check the poster"
    >
      <p className={styles.text}>
        Poster Trace couldn&apos;t be reached to check this poster. Check your
        connection and try again.
      </p>
      <Button variant="filled" fontSize="1.25rem" onClick={onTryAgain}>
        Try again
      </Button>
      <Button variant="outline" fontSize="1rem" onClick={onClose}>
        Read a different poster
      </Button>
    </CentralDialog>
  );
}
