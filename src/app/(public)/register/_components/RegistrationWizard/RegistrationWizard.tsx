"use client";

import { useState, useTransition } from "react";
import * as Tabs from "@radix-ui/react-tabs";

import type { RegistrationLocationInput } from "@application/dto/inputs";
import Button from "@/components/Button";
import { TextInput } from "@/components/Form";
import { randomPosterName, resolvePosterName } from "@/utils/posterName";
import type { PosterId } from "@domain/poster/PosterId";

import { registerPoster } from "../../actions";
import type { CantRegisterReason } from "../CantRegisterDialog";
import LocationStep, { useLocationFix } from "../LocationStep";
import ReviewStep from "../ReviewStep";
import styles from "./RegistrationWizard.module.css";

type Step = "name" | "location" | "review";

interface RegistrationWizardProps {
  posterId: PosterId;
  onSubmitted: () => void;
  onCantRegister: (reason: CantRegisterReason) => void;
}

/**
 * Registering a poster in three steps: Name, Location and Review. Both the
 * name and location are optional, so any step can be opened at any time. What
 * has been entered lives here, so it's kept as the steps unmount.
 */
export default function RegistrationWizard({
  posterId,
  onSubmitted,
  onCantRegister,
}: RegistrationWizardProps) {
  const [step, setStep] = useState<Step>("name");
  const [posterName, setPosterName] = useState("");
  // Shown as the field's placeholder and saved when no name is entered.
  const [defaultPosterName] = useState(randomPosterName);
  const [location, setLocation] = useState<RegistrationLocationInput | null>(
    null,
  );
  const [fix, setFix] = useState<RegistrationLocationInput | null>(null);
  const locationFix = useLocationFix((newFix) => {
    // A new fix replaces any dragged spot.
    setFix(newFix);
    setLocation(newFix);
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const savedPosterName = resolvePosterName(posterName, defaultPosterName);

  function submit() {
    setError(null);
    startTransition(async () => {
      let result: Awaited<ReturnType<typeof registerPoster>>;
      try {
        result = await registerPoster(posterId, savedPosterName, location);
      } catch {
        // The request failed (e.g. the connection dropped). Submitting again
        // is safe: if it was saved after all, the poster is now registered and
        // the "already registered" dialog says so.
        setError(
          "Poster Trace couldn't be reached. Check your connection and submit again.",
        );
        return;
      }
      if (result.outcome === "saved") {
        onSubmitted();
      } else if (result.outcome === "invalid") {
        setError(result.error);
      } else {
        onCantRegister(result.outcome);
      }
    });
  }

  return (
    <Tabs.Root
      className={styles.wizard}
      value={step}
      onValueChange={(value) => setStep(value as Step)}
    >
      <Tabs.List className={styles.tabs} aria-label="Registration steps">
        {/* Locked while submitting, so what's saved is what was reviewed. */}
        <Tabs.Trigger className={styles.tab} value="name" disabled={isPending}>
          Name
        </Tabs.Trigger>
        <Tabs.Trigger
          className={styles.tab}
          value="location"
          disabled={isPending}
        >
          Location
        </Tabs.Trigger>
        <Tabs.Trigger
          className={styles.tab}
          value="review"
          disabled={isPending}
        >
          Review
        </Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="name">
        <form
          className={styles.nameStep}
          onSubmit={(event) => {
            event.preventDefault();
            setStep("location");
          }}
        >
          <TextInput
            label="Poster name"
            name="posterName"
            required={false}
            placeholder={defaultPosterName}
            helperText="Give it a memorable name to help you remember which poster this is."
            value={posterName}
            onChange={(event) => setPosterName(event.target.value)}
          />
          <Button variant="filled" fontSize="1.25rem" type="submit">
            Next
          </Button>
        </form>
      </Tabs.Content>

      <Tabs.Content value="location">
        <LocationStep
          location={location}
          fix={fix}
          fixStatus={locationFix.status}
          onRequestFix={locationFix.request}
          onMove={setLocation}
          onRemove={() => setLocation(null)}
          onNext={() => setStep("review")}
        />
      </Tabs.Content>

      <Tabs.Content value="review">
        <ReviewStep
          posterName={savedPosterName}
          location={location}
          error={error}
          isPending={isPending}
          onSubmit={submit}
        />
      </Tabs.Content>
    </Tabs.Root>
  );
}
