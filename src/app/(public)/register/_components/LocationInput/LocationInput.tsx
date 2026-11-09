"use client";

import { useState } from "react";

import Button from "@/components/Button";

import styles from "./LocationInput.module.css";

export interface CapturedLocation {
  latitude: number;
  longitude: number;
  // In metres, as the browser reports it.
  accuracy: number;
}

interface LocationInputProps {
  value: CapturedLocation | null;
  onChange: (location: CapturedLocation | null) => void;
}

type Status = "idle" | "pending" | "denied" | "failed";

const ERROR_MESSAGES: Partial<Record<Status, string>> = {
  denied: "Location access was blocked. You can still register without it.",
  failed: "Couldn't get your location. Try again, or register without it.",
};

// Optional: registering a poster without its location is allowed, so a
// failure only shows a message and never blocks the form.
export default function LocationInput({ value, onChange }: LocationInputProps) {
  const [status, setStatus] = useState<Status>("idle");

  function requestLocation() {
    if (!("geolocation" in navigator)) {
      setStatus("failed");
      return;
    }
    setStatus("pending");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setStatus("idle");
        onChange({
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
        });
      },
      (error) => {
        setStatus(error.code === error.PERMISSION_DENIED ? "denied" : "failed");
      },
      // The poster's exact spot matters, so ask for a fresh, precise fix.
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    );
  }

  const errorMessage = ERROR_MESSAGES[status];

  return (
    <div className={styles.wrapper}>
      <span className={styles.label}>Location (optional)</span>
      {value ? (
        <div className={styles.captured}>
          <p role="status">
            Location captured (±{Math.round(value.accuracy)} m)
          </p>
          <Button
            variant="transparent"
            fontSize="1rem"
            type="button"
            onClick={() => onChange(null)}
          >
            Remove
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          fontSize="1rem"
          type="button"
          disabled={status === "pending"}
          onClick={requestLocation}
        >
          {status === "pending" ? "Getting location…" : "Use my location"}
        </Button>
      )}
      {errorMessage && !value ? (
        <p className={styles.error} role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
