"use client";

import { useEffect, useState } from "react";
import { signIn } from "@/lib/auth-client";

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

        await signIn.social({
            provider: "google",
            callbackURL: "/dashboard",
            errorCallbackURL: "/error",
            newUserCallbackURL: "/welcome",
            fetchOptions: {
                onError: (context) => {
                    setIsPending(false);
                    setError(context.error.message || "Something went wrong signing in. Please try again.");
                },
            },
        });
    }

    return (
        <>
            <p>Sign In</p>
            <button onClick={handleSignIn} disabled={isPending}>
                {isPending ? "Redirecting to Google…" : "Sign In"}
            </button>
            {error ? <p role="alert">{error}</p> : null}
        </>
    );
}