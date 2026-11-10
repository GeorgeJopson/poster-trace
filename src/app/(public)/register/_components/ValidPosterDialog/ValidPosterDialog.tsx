"use client";

import { useState, useTransition } from "react";

import Button from "@/components/Button";
import CentralDialog from "@/components/CentralDialog";
import { SubmitButton, TextInput } from "@/components/Form";
import { randomPosterName, resolvePosterName } from "@/utils/posterName";
import type { PosterId } from "@domain/poster/PosterId";

import { registerPoster } from "../../actions";
import LocationInput, { type CapturedLocation } from "../LocationInput";
import styles from "./ValidPosterDialog.module.css";

interface ValidPosterDialogProps {
  // The poster that was read, while the dialog is open.
  posterId: PosterId | null;
  onClose: () => void;
}

// Opens when the reader reads one of this site's scan URLs. Submitting saves
// the poster's registration and closes the dialog, or shows why it couldn't.
export default function ValidPosterDialog({
  posterId,
  onClose,
}: ValidPosterDialogProps) {
  return (
    <CentralDialog
      open={posterId !== null}
      onOpenChange={(nextOpen) => !nextOpen && onClose()}
      title="Valid poster"
    >
      {/* The dialog's content unmounts on close, so each read starts a fresh
          form with a new random name. */}
      {posterId !== null ? (
        <RegistrationForm posterId={posterId} onSubmitted={onClose} />
      ) : null}
      <Button variant="outline" fontSize="1rem" onClick={onClose}>
        Register a different poster
      </Button>
    </CentralDialog>
  );
}

function RegistrationForm({
  posterId,
  onSubmitted,
}: {
  posterId: PosterId;
  onSubmitted: () => void;
}) {
  const [location, setLocation] = useState<CapturedLocation | null>(null);
  const [posterName, setPosterName] = useState("");
  // Shown as the field's placeholder and saved when no name is entered.
  const [defaultPosterName] = useState(randomPosterName);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await registerPoster(
            posterId,
            resolvePosterName(posterName, defaultPosterName),
            location,
          );
          if (result.error !== null) {
            setError(result.error);
          } else {
            onSubmitted();
          }
        });
      }}
    >
      <LocationInput value={location} onChange={setLocation} />
      <TextInput
        label="Poster name"
        name="posterName"
        required={false}
        placeholder={defaultPosterName}
        helperText="Give it a memorable name to help you remember which poster this is."
        value={posterName}
        onChange={(event) => setPosterName(event.target.value)}
      />
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      <SubmitButton isPending={isPending} isPendingText="Registering…">
        Submit
      </SubmitButton>
    </form>
  );
}
