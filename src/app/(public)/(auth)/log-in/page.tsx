"use client";

import { Suspense } from "react";
import Link from "next/link";

import { authClient } from "@infrastructure/auth/authClient";
import AuthCardForm from "@/components/AuthCardForm";
import { TextInput } from "@/components/Form";
import PasswordResetLink from "@/components/PasswordResetLink";
import { routeNames } from "@/routeNames";

import { PublicNavBarSpacer } from "@/components/PublicNavigation";
import styles from "./LogIn.module.css";
import ResetSuccessNotice from "./_components/ResetSuccessNotice";

export default function SignIn() {
  return (
    <>
      <PublicNavBarSpacer />
      <AuthCardForm
        actionName="Log In"
        pendingText="Logging In …"
        fallbackErrorMessage="Something went wrong signing in. Please try again."
        submit={(formData) =>
          authClient.signIn.email({
            email: String(formData.get("email")),
            password: String(formData.get("password")),
          })
        }
        switchPrompt={
          <>
            Don&apos;t have an account?{" "}
            <Link href={routeNames.signUp}>Sign up</Link>
          </>
        }
        notice={
          // useSearchParams needs a Suspense boundary so the page can still be
          // prerendered.
          <Suspense fallback={null}>
            <ResetSuccessNotice />
          </Suspense>
        }
      >
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
        <PasswordResetLink className={styles.resetLink} />
      </AuthCardForm>
    </>
  );
}
