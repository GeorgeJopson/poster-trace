"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

import styles from "./SignIn.module.css";
import Header from "@/components/Header";
import GoogleSignOnButton from "@/app/sign-in/GoogleSignOnButton";

import { useRouter } from "next/navigation";

import type { BetterFetchOption } from "better-auth/react";

export default function SignIn() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (session) {
      router.push("/dashboard");
    }
  }, [session, router]);

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
      } as BetterFetchOption,
    });
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <Header variant={"heading"}>Sign Up / Log In</Header>
        <div className={styles.buttonGroup}>
          <GoogleSignOnButton isPending={isPending} onClick={handleSignIn} />
        </div>
        {error ? <p role="alert">{error}</p> : null}
      </div>
    </div>
  );
}
