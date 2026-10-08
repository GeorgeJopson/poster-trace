"use client";

import React, { useState } from "react";
import Link from "next/link";

import { authClient } from "@/auth/auth-client";
import Button from "@/components/Button";
import CentralColumn from "@/components/CentralColumn";
import Header from "@/components/Header";
import { routeNames } from "@/routeNames";

import GoogleSignIn from "../_components/GoogleSignIn";
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

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.fields}>
              <label className={styles.label} htmlFor="email">
                Email
              </label>
              <input
                className={styles.input}
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
              />

              <label className={styles.label} htmlFor="password">
                Password
              </label>
              <input
                className={styles.input}
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>

            {error ? <p role="alert">{error}</p> : null}

            <div className={styles.submitButtonWrapper}>
              <Button
                variant={"filled"}
                fontSize={"1.25rem"}
                type="submit"
                disabled={isPending}
              >
                {isPending ? "Logging In …" : "Log In"}
              </Button>
            </div>
          </form>

          <p className={styles.divider}>or</p>

          <div className={styles.buttonGroup}>
            <GoogleSignIn label="Log In with Google" />
          </div>

          <p className={styles.switchPrompt}>
            Don&apos;t have an account?{" "}
            <Link href={routeNames.signUp}>Sign up</Link>
          </p>
        </div>
      </div>
    </CentralColumn>
  );
}
