"use client";

import Link from "next/link";

import { authClient } from "@/auth/auth-client";
import AuthCardForm from "@/components/AuthCardForm";
import { TextInput } from "@/components/Form";
import { routeNames } from "@/routeNames";

export default function SignIn() {
  return (
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
    >
      <TextInput label="Email" name="email" type="email" autoComplete="email" />
      <TextInput
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
      />
    </AuthCardForm>
  );
}
