"use client";

import React, { useState } from "react";
import Link from "next/link";

import { authClient } from "@/auth/auth-client";
import CentralColumn from "@/components/CentralColumn";
import Form, { SubmitButton, TextInput } from "@/components/Form";
import Header from "@/components/Header";
import SocialSignOn from "@/components/SocialSignOn";
import { routeNames } from "@/routeNames";

import useRedirectIfSignedIn from "../_components/useRedirectIfSignedIn";
import styles from "../_components/AuthCard.module.css";

// Matches Better Auth's default minPasswordLength.
const MIN_PASSWORD_LENGTH = 8;

export default function SignUp() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useRedirectIfSignedIn();

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setIsPending(true);
    setError(null);

    // Signing up also signs the user in, so the new session triggers
    // useRedirectIfSignedIn.
    const { error } = await authClient.signUp.email({
      name: String(formData.get("name")),
      email: String(formData.get("email")),
      password: String(formData.get("password")),
    });

    if (error) {
      setIsPending(false);
      setError(
        error.message || "Something went wrong signing up. Please try again.",
      );
    }
  }

  return (
    <CentralColumn>
      <div className={styles.wrapper}>
        <div className={styles.card}>
          <Header variant={"heading"}>Sign Up</Header>

          <Form
            handleSubmit={handleSubmit}
            error={error}
            fields={
              <>
                <TextInput label="Name" name="name" autoComplete="name" />
                <TextInput
                  label="Email"
                  name="email"
                  type="email"
                  autoComplete="email"
                />
                <TextInput
                  label="Password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={MIN_PASSWORD_LENGTH}
                />
              </>
            }
            submitBtn={
              <SubmitButton isPending={isPending} isPendingText="Signing Up …">
                Sign Up
              </SubmitButton>
            }
          />

          <p className={styles.divider}>or</p>

          <SocialSignOn actionName="Sign Up" />

          <p className={styles.switchPrompt}>
            Already have an account?{" "}
            <Link href={routeNames.signIn}>Log in</Link>
          </p>
        </div>
      </div>
    </CentralColumn>
  );
}
