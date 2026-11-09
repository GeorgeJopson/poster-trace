"use client";

import Button from "@/components/Button";
import CentralDialog from "@/components/CentralDialog";

import styles from "./ValidPosterDialog.module.css";

interface ValidPosterDialogProps {
  open: boolean;
  onClose: () => void;
}

// Opens when the reader reads one of this site's scan URLs. The form is a
// placeholder for the registration form, so submitting it only closes the
// dialog.
export default function ValidPosterDialog({
  open,
  onClose,
}: ValidPosterDialogProps) {
  return (
    <CentralDialog
      open={open}
      onOpenChange={(nextOpen) => !nextOpen && onClose()}
      title="Valid poster"
    >
      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          onClose();
        }}
      >
        <Button variant="filled" fontSize="1.25rem" type="submit">
          Submit
        </Button>
      </form>
      <Button variant="outline" fontSize="1rem" onClick={onClose}>
        Register a different poster
      </Button>
    </CentralDialog>
  );
}
