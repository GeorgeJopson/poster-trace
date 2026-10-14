"use client";

import { useEffect, useState } from "react";

import { authClient } from "@/auth/auth-client";
import Form, { SubmitButton, TextInput } from "@/components/Form";
import { routeNames } from "@/routeNames";
import useAuthFormSubmit from "@/utils/useAuthFormSubmit";

import styles from "./RequestPasswordResetForm.module.css";

// Better Auth allows 3 requests per 60 seconds per IP in production, so one
// email a minute keeps users under the limit.
const COOLDOWN_MS = 60 * 1000;

export default function RequestPasswordResetForm() {
  // Signed-in users (e.g. from the account page) get their email filled in.
  // Read on the client so the page stays static.
  const { data: session } = authClient.useSession();
  const defaultEmail = session?.user.email ?? "";

  // When the last email was sent, and the time the countdown was last
  // updated. Both are set together after a successful request.
  const [sentAt, setSentAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (sentAt === null) return;

    const interval = setInterval(() => {
      const time = Date.now();
      setNow(time);
      if (time - sentAt >= COOLDOWN_MS) {
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [sentAt]);

  const secondsLeft =
    sentAt === null
      ? 0
      : Math.max(0, Math.ceil((COOLDOWN_MS - (now - sentAt)) / 1000));

  const { isPending, error, handleSubmit } = useAuthFormSubmit(
    async (formData) => {
      const { error } = await authClient.requestPasswordReset({
        email: String(formData.get("email")),
        // Made absolute on the server (see src/auth/auth.ts).
        redirectTo: routeNames.passwordResetAuthorized,
      });
      if (error) return { error };

      const time = Date.now();
      setSentAt(time);
      setNow(time);
      return { error: null };
    },
    {
      fallbackErrorMessage:
        "Something went wrong sending the reset email. Please try again.",
      keepPendingOnSuccess: false,
    },
  );

  return (
    <>
      <p className={styles.intro}>
        Enter your email and we&apos;ll send you a link to choose a new
        password.
      </p>

      <Form
        handleSubmit={handleSubmit}
        error={error}
        fields={
          <TextInput
            // Remounts with the email once the session loads.
            key={defaultEmail}
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={defaultEmail}
          />
        }
        submitBtn={
          <SubmitButton
            isPending={isPending}
            isPendingText="Sending …"
            disabled={secondsLeft > 0}
          >
            Send reset email
          </SubmitButton>
        }
      />

      <div className={styles.status}>
        <div role="status">
          {sentAt !== null ? (
            <p>
              If an account exists for that email, we&apos;ve sent a reset link.
            </p>
          ) : null}
        </div>
        {/* Outside the live region, so screen readers don't announce every
            tick. */}
        {secondsLeft > 0 ? (
          <p>You can send another email in {secondsLeft}s.</p>
        ) : null}
      </div>
    </>
  );
}
