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

export default function SignIn() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useRedirectIfSignedIn();

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setIsPending(true);
    setError(null);

    // On success the new session triggers useRedirectIfSignedIn.
    const { error } = await authClient.signIn.email({
      email: String(formData.get("email")),
      password: String(formData.get("password")),
    });

    if (error) {
      setIsPending(false);
      setError(
        error.message || "Something went wrong signing in. Please try again.",
      );
    }
  }

  return (
    <CentralColumn>
      <div className={styles.wrapper}>
        <div className={styles.card}>
          <Header variant={"heading"}>Log In</Header>

          <Form
            handleSubmit={handleSubmit}
            error={error}
            fields={
              <>
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
                  autoComplete="current-password"
                />
              </>
            }
            submitBtn={
              <SubmitButton isPending={isPending} isPendingText="Logging In …">
                Log In
              </SubmitButton>
            }
          />

          <p className={styles.divider}>or</p>

          <SocialSignOn actionName="Log In" />

          <p className={styles.switchPrompt}>
            Don&apos;t have an account?{" "}
            <Link href={routeNames.signUp}>Sign up</Link>
          </p>
        </div>
      </div>
    </CentralColumn>
  );
}
