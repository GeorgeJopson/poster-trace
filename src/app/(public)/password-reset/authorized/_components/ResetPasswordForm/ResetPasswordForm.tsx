"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { AuthService } from "@clientApplication/services/AuthService";
import AuthCard from "@/components/AuthCard";
import Form, { SubmitButton, TextInput } from "@/components/Form";
import { routeNames } from "@/routeNames";
import useAuthFormSubmit from "@/utils/useAuthFormSubmit";

import InvalidResetLink from "../InvalidResetLink";

interface ResetPasswordFormProps {
  token: string;
}

export default function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const minPasswordLength = AuthService.getMinPasswordLength();
  // The token can expire or be used up (e.g. in another tab) after the page
  // loads, which only shows up when submitting.
  const [isTokenInvalid, setIsTokenInvalid] = useState(false);

  const { isPending, error, handleSubmit } = useAuthFormSubmit(
    async (formData) => {
      const newPassword = String(formData.get("newPassword"));
      if (newPassword !== String(formData.get("confirmPassword"))) {
        return { error: { message: "The passwords don't match." } };
      }

      const { error, isTokenInvalid } = await AuthService.resetPassword({
        newPassword,
        token,
      });
      if (isTokenInvalid) {
        setIsTokenInvalid(true);
        return { error: null };
      }
      if (error) return { error };

      // The reset signs out every session, so the user logs in again.
      router.push(`${routeNames.signIn}?reset=success`);
      return { error: null };
    },
    {
      fallbackErrorMessage:
        "Something went wrong resetting your password. Please try again.",
    },
  );

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
              minLength={minPasswordLength}
            />
            <TextInput
              label="Confirm new password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={minPasswordLength}
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
