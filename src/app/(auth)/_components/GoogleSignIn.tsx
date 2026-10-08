"use client";

import { useEffect, useState } from "react";
import type { BetterFetchOption } from "better-auth/react";

import { authClient } from "@/auth/auth-client";
import { routeNames } from "@/routeNames";
import GoogleSignOnButton from "./GoogleSignOnButton";

interface GoogleSignInProps {
  label: string;
}

// Google creates the account on first sign-in, so sign-up and log-in share
// this flow.
export default function GoogleSignIn({ label }: GoogleSignInProps) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Coming back from Google with the back button restores this page from the
  // bfcache, still showing the pending state.
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

    // Absolute URLs, because Netlify appends the OAuth callback's query string
    // (code, state, …) to relative redirect locations.
    const dashboardURL = new URL(routeNames.dashboard, window.location.origin)
      .href;

    await authClient.signIn.social({
      provider: "google",
      callbackURL: dashboardURL,
      errorCallbackURL: new URL("/error", window.location.origin).href,
      newUserCallbackURL: dashboardURL,
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
    <>
      <GoogleSignOnButton
        isPending={isPending}
        onClick={handleSignIn}
        label={label}
      />
      {error ? <p role="alert">{error}</p> : null}
    </>
  );
}
