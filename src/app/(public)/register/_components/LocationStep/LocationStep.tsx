"use client";

import type { RegistrationLocationInput } from "@application/dto/inputs";
import Button from "@/components/Button";

import PosterLocationMap from "../PosterLocationMap";
import styles from "./LocationStep.module.css";
import type { LocationFixStatus } from "./useLocationFix";

const ERROR_MESSAGES: Partial<Record<LocationFixStatus, string>> = {
  denied: "Location access was blocked. You can still register without it.",
  failed: "Couldn't get your location. Try again, or register without it.",
};

interface LocationStepProps {
  location: RegistrationLocationInput | null;
  /** The latest fix, which the pin jumps to when it changes. */
  fix: RegistrationLocationInput | null;
  fixStatus: LocationFixStatus;
  onRequestFix: () => void;
  onMove: (location: RegistrationLocationInput) => void;
  onRemove: () => void;
  onNext: () => void;
}

// Optional: a failure only shows a message and never blocks registering. The
// pin starts at the browser's fix, and the person drags it to the poster.
export default function LocationStep({
  location,
  fix,
  fixStatus,
  onRequestFix,
  onMove,
  onRemove,
  onNext,
}: LocationStepProps) {
  const isPending = fixStatus === "pending";
  const errorMessage = ERROR_MESSAGES[fixStatus];

  return (
    <div className={styles.step}>
      {location ? (
        <>
          <p className={styles.hint}>Drag the pin to where the poster is.</p>
          <PosterLocationMap location={location} fix={fix} onMove={onMove} />
          <div className={styles.actions}>
            <Button
              variant="outline"
              fontSize="1rem"
              type="button"
              disabled={isPending}
              onClick={onRequestFix}
            >
              {isPending ? "Getting location…" : "Use my location again"}
            </Button>
            <Button
              variant="transparent"
              fontSize="1rem"
              type="button"
              onClick={onRemove}
            >
              Remove location
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className={styles.hint}>
            Optional: save where the poster is, so its scans show on the
            campaign&apos;s map.
          </p>
          <Button
            variant="outline"
            fontSize="1rem"
            type="button"
            disabled={isPending}
            onClick={onRequestFix}
          >
            {isPending ? "Getting location…" : "Use my location"}
          </Button>
        </>
      )}
      {errorMessage ? (
        <p className={styles.error} role="alert">
          {errorMessage}
        </p>
      ) : null}
      <div className={styles.next}>
        <Button
          variant="filled"
          fontSize="1.25rem"
          type="button"
          onClick={onNext}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
