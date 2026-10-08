"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { BetterFetchOption } from "better-auth/react";

import { authClient } from "@/auth/auth-client";
import { icons } from "@/imageDetails";
import { routeNames } from "@/routeNames";
import styles from "./SocialSignOn.module.css";

type SocialSignOnMethod = {
  name: string;
  // Path to the logo in public/.
  logo: string;
  signOnFunc: (onError: (message: string) => void) => Promise<unknown>;
};

// Social providers create the account on first sign-in, so sign-up and
// log-in share these.
const socialSignOnMethods: SocialSignOnMethod[] = [
  {
    name: "Google",
    logo: icons.google.src,
    signOnFunc: (onError) => {
      // Absolute URLs, because Netlify appends the OAuth callback's query
      // string (code, state, …) to relative redirect locations.
      const dashboardURL = new URL(routeNames.dashboard, window.location.origin)
        .href;

      return authClient.signIn.social({
        provider: "google",
        callbackURL: dashboardURL,
        errorCallbackURL: new URL("/error", window.location.origin).href,
        newUserCallbackURL: dashboardURL,
        fetchOptions: {
          onError: (context) => onError(context.error.message),
        } as BetterFetchOption,
      });
    },
  },
];

type SocialSignOnProps = {
  actionName: string;
};

export default function SocialSignOn({ actionName }: SocialSignOnProps) {
  // Name of the method that is redirecting, if any.
  const [pendingMethod, setPendingMethod] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Coming back from the provider with the back button restores this page
  // from the bfcache, still showing the pending state.
  useEffect(() => {
    function handlePageShow(event: PageTransitionEvent) {
      if (event.persisted) {
        setPendingMethod(null);
      }
    }

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  async function handleSignOn({ name, signOnFunc }: SocialSignOnMethod) {
    setPendingMethod(name);
    setError(null);

    await signOnFunc((message) => {
      setPendingMethod(null);
      setError(message || "Something went wrong signing in. Please try again.");
    });
  }

  return (
    <div className={styles.wrapper}>
      {socialSignOnMethods.map((method) => {
        const isPending = pendingMethod === method.name;
        const label = isPending
          ? "Redirecting …"
          : `${actionName} with ${method.name}`;

        return (
          <button
            key={method.name}
            type="button"
            className={styles.button}
            onClick={() => handleSignOn(method)}
          >
            <div className={styles.state}></div>
            <div className={styles.contentWrapper}>
              <Image
                className={`${styles.icon} ${isPending ? styles.spin : ""}`}
                src={method.logo}
                // Decorative: the label already names the provider.
                alt=""
                width={20}
                height={20}
              />
              <span className={styles.contents}>{label}</span>
            </div>
          </button>
        );
      })}
      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
}
