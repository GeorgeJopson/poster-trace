"use client";

import { useState } from "react";

import type { RegistrationLocationInput } from "@application/dto/inputs";

export type LocationFixStatus = "idle" | "pending" | "denied" | "failed";

/**
 * Asks the browser where the person registering is. `onFix` gets each fix;
 * a failed request only changes the status, so a location already taken stays.
 */
export function useLocationFix(
  onFix: (location: RegistrationLocationInput) => void,
) {
  const [status, setStatus] = useState<LocationFixStatus>("idle");

  function request() {
    if (!("geolocation" in navigator)) {
      setStatus("failed");
      return;
    }
    setStatus("pending");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setStatus("idle");
        onFix({ latitude: coords.latitude, longitude: coords.longitude });
      },
      (error) => {
        setStatus(error.code === error.PERMISSION_DENIED ? "denied" : "failed");
      },
      // The fix is where the map starts, so ask for a fresh, precise one.
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    );
  }

  return { status, request };
}
