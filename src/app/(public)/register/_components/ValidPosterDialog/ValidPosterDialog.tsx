"use client";

import { useState } from "react";

import Button from "@/components/Button";
import CentralDialog from "@/components/CentralDialog";
import { TextInput } from "@/components/Form";
import { randomPosterName, resolvePosterName } from "@/utils/posterName";
import type { PosterId } from "@domain/poster/PosterId";

import LocationInput, { type CapturedLocation } from "../LocationInput";
import styles from "./ValidPosterDialog.module.css";

const POSTER_NAME_MAX_LENGTH = 60;

interface ValidPosterDialogProps {
  // The poster that was read, while the dialog is open.
  posterId: PosterId | null;
  onClose: () => void;
}

// Opens when the reader reads one of this site's scan URLs. Registrations
// aren't saved yet, so submitting logs the registration and closes the dialog.
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

  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        console.log({
          posterId,
          location,
          posterName: resolvePosterName(posterName, defaultPosterName),
        });
        onSubmitted();
      }}
    >
      <LocationInput value={location} onChange={setLocation} />
      <TextInput
        label="Poster name"
        name="posterName"
        required={false}
        maxLength={POSTER_NAME_MAX_LENGTH}
        placeholder={defaultPosterName}
        helperText="Give it a memorable name to help you remember which poster this is."
        value={posterName}
        onChange={(event) => setPosterName(event.target.value)}
      />
      <Button variant="filled" fontSize="1.25rem" type="submit">
        Submit
      </Button>
    </form>
  );
}
