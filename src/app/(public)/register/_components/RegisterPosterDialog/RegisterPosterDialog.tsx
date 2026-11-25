"use client";

import Button from "@/components/Button";
import CentralDialog from "@/components/CentralDialog";
import type { PosterId } from "@domain/poster/PosterId";

import type { CantRegisterReason } from "../CantRegisterDialog";
import RegistrationWizard from "../RegistrationWizard";

interface RegisterPosterDialogProps {
  // The poster that was read, while the dialog is open.
  posterId: PosterId | null;
  onClose: () => void;
  // Called instead of showing an error when a submit finds the poster can't be
  // registered after all, e.g. someone registered it after it was read.
  onCantRegister: (reason: CantRegisterReason) => void;
}

// Opens when the reader reads an unregistered poster. Submitting saves the
// poster's registration and closes the dialog. An error the helper can fix is
// shown on the wizard's Review step; otherwise the dialog hands over to
// CantRegisterDialog.
export default function RegisterPosterDialog({
  posterId,
  onClose,
  onCantRegister,
}: RegisterPosterDialogProps) {
  return (
    <CentralDialog
      open={posterId !== null}
      onOpenChange={(nextOpen) => !nextOpen && onClose()}
      title="Register this poster"
    >
      {/* The dialog's content unmounts on close, so each read starts a fresh
          wizard with a new random name. */}
      {posterId !== null ? (
        <RegistrationWizard
          posterId={posterId}
          onSubmitted={onClose}
          onCantRegister={onCantRegister}
        />
      ) : null}
      <Button variant="outline" fontSize="1rem" onClick={onClose}>
        Read a different poster
      </Button>
    </CentralDialog>
  );
}
