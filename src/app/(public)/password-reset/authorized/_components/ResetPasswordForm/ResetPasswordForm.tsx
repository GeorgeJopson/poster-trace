"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/auth/auth-client";
import { MIN_PASSWORD_LENGTH } from "@/auth/passwordRules";
import AuthCard from "@/components/AuthCard";
import Form, { SubmitButton, TextInput } from "@/components/Form";
import { routeNames } from "@/routeNames";

import InvalidResetLink from "../InvalidResetLink";

interface ResetPasswordFormProps {
  token: string;
}

export default function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The token can expire or be used up (e.g. in another tab) after the page
  // loads, which only shows up when submitting.
  const [isTokenInvalid, setIsTokenInvalid] = useState(false);

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newPassword = String(formData.get("newPassword"));

    if (newPassword !== String(formData.get("confirmPassword"))) {
      setError("The passwords don't match.");
      return;
    }

    setIsPending(true);
    setError(null);

    const { error } = await authClient.resetPassword({ newPassword, token });

    if (error) {
      setIsPending(false);
      if (error.code === "INVALID_TOKEN") {
        setIsTokenInvalid(true);
      } else {
        setError(
          error.message ||
            "Something went wrong resetting your password. Please try again.",
        );
      }
      return;
    }

    // The reset signs out every session, so the user logs in again.
    router.push(`${routeNames.signIn}?reset=success`);
  }

  if (isTokenInvalid) {
    return <InvalidResetLink />;
  }

  return (
    <AuthCard heading="Choose a new password">
      <Form
        handleSubmit={handleSubmit}
        error={error}
        fields={
          <>
            <TextInput
              label="New password"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
            />
            <TextInput
              label="Confirm new password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
            />
          </>
        }
        submitBtn={
          <SubmitButton isPending={isPending} isPendingText="Saving …">
            Save password
          </SubmitButton>
        }
      />
    </AuthCard>
  );
}
