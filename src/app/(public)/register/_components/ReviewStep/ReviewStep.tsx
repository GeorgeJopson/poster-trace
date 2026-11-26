"use client";

import type { RegistrationLocationInput } from "@application/dto/inputs";
import { SubmitButton } from "@/components/Form";

import PosterLocationMap from "../PosterLocationMap";
import styles from "./ReviewStep.module.css";

interface ReviewStepProps {
  /** The poster name that will be saved, typed or the default. */
  posterName: string;
  location: RegistrationLocationInput | null;
  /** A failed submit's message, shown above the button. */
  error: string | null;
  isPending: boolean;
  onSubmit: () => void;
}

// What submitting will save, and the only place to submit it.
export default function ReviewStep({
  posterName,
  location,
  error,
  isPending,
  onSubmit,
}: ReviewStepProps) {
  return (
    <form
      className={styles.step}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <dl className={styles.summary}>
        <dt className={styles.term}>Poster name</dt>
        <dd className={styles.value}>{posterName}</dd>
        <dt className={styles.term}>Location</dt>
        <dd className={styles.value}>
          {location ? (
            <PosterLocationMap location={location} />
          ) : (
            "No location will be saved"
          )}
        </dd>
      </dl>
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
