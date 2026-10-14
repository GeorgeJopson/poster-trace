"use client";

import React from "react";

import AuthCard from "@/components/AuthCard";
import Form, { SubmitButton } from "@/components/Form";
import SocialSignOn from "@/components/SocialSignOn";
import { routeNames } from "@/routeNames";
import useAuthFormSubmit from "@/utils/useAuthFormSubmit";
import useRedirectIfSignedIn from "@/utils/useRedirectIfSignedIn";

import styles from "./AuthCardForm.module.css";

interface AuthCardFormProps {
  // Used as the heading, submit button and social sign-on label.
  actionName: string;
  pendingText: string;
  fallbackErrorMessage: string;
  // The form's fields.
  children: React.ReactNode;
  // Resolves once the auth request finishes. On success the new session
  // triggers useRedirectIfSignedIn.
  submit: (
    formData: FormData,
  ) => Promise<{ error: { message?: string } | null }>;
  switchPrompt: React.ReactNode;
  // Shown above the form, e.g. after a password reset.
  notice?: React.ReactNode;
}

export default function AuthCardForm({
  actionName,
  pendingText,
  fallbackErrorMessage,
  children,
  submit,
  switchPrompt,
  notice,
}: AuthCardFormProps) {
  const { isPending, error, handleSubmit } = useAuthFormSubmit(submit, {
    fallbackErrorMessage,
  });

  useRedirectIfSignedIn(routeNames.dashboard);

  return (
    <AuthCard heading={actionName}>
      {notice}

      <Form
        handleSubmit={handleSubmit}
        error={error}
        fields={children}
        submitBtn={
          <SubmitButton isPending={isPending} isPendingText={pendingText}>
            {actionName}
          </SubmitButton>
        }
      />

      <p className={styles.divider}>or</p>

      <SocialSignOn actionName={actionName} />

      <p className={styles.switchPrompt}>{switchPrompt}</p>
    </AuthCard>
  );
}
