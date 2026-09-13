"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

import styles from "./SignIn.module.css";
import Header from "@/components/Header";
import Button from "@/components/Button";

export default function SignIn() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function handlePageShow(event: PageTransitionEvent) {
      if (event.persisted) {
        setIsPending(false);
      }
    }

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  async function handleSignIn() {
    setIsPending(true);
    setError(null);

    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
      errorCallbackURL: "/error",
      newUserCallbackURL: "/dashboard",
      fetchOptions: {
        onError: (context) => {
          setIsPending(false);
          setError(
            context.error.message ||
              "Something went wrong signing in. Please try again.",
          );
        },
      },
    });
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <Header variant={"heading"}>Sign Up / Log In</Header>
        <div className={styles.buttonGroup}>
          <Button
            variant={"outline"}
            fontSize={"2rem"}
            onClick={handleSignIn}
            disabled={isPending}
          >
            {isPending ? "Redirecting …" : "Sign In with Google"}
          </Button>
        </div>
        {error ? <p role="alert">{error}</p> : null}
      </div>
    </div>
  );
}
