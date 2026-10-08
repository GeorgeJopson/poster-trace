"use client";

import { useState } from "react";
import Link from "next/link";

import { authClient } from "@/auth/auth-client";
import Button from "@/components/Button";
import Header from "@/components/Header";
import { routeNames } from "@/routeNames";

import GoogleSignIn from "../_components/GoogleSignIn";
import useRedirectIfSignedIn from "../_components/useRedirectIfSignedIn";
import styles from "../_components/AuthCard.module.css";

// Matches Better Auth's default minPasswordLength.
const MIN_PASSWORD_LENGTH = 8;

export default function SignUp() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useRedirectIfSignedIn();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
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
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <Header variant={"heading"}>Sign Up</Header>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.fields}>
            <label className={styles.label} htmlFor="name">
              Name
            </label>
            <input
              className={styles.input}
              id="name"
              name="name"
              autoComplete="name"
              required
            />

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
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
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
              {isPending ? "Signing Up …" : "Sign Up"}
            </Button>
          </div>
        </form>

        <p className={styles.divider}>or</p>

        <div className={styles.buttonGroup}>
          <GoogleSignIn label="Sign Up with Google" />
        </div>

        <p className={styles.switchPrompt}>
          Already have an account? <Link href={routeNames.signIn}>Log in</Link>
        </p>
      </div>
    </div>
  );
}
