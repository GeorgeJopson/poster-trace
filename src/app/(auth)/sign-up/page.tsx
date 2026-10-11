"use client";

import Link from "next/link";

import { authClient } from "@/auth/auth-client";
import AuthCardForm from "@/components/AuthCardForm";
import { TextInput } from "@/components/Form";
import { routeNames } from "@/routeNames";

// Matches Better Auth's default minPasswordLength.
const MIN_PASSWORD_LENGTH = 8;

export default function SignUp() {
  return (
    <AuthCardForm
      actionName="Sign Up"
      pendingText="Signing Up …"
      fallbackErrorMessage="Something went wrong signing up. Please try again."
      // Signing up also signs the user in.
      submit={(formData) =>
        authClient.signUp.email({
          name: String(formData.get("name")),
          email: String(formData.get("email")),
          password: String(formData.get("password")),
        })
      }
      switchPrompt={
        <>
          Already have an account? <Link href={routeNames.signIn}>Log in</Link>
        </>
      }
    >
      <TextInput label="Name" name="name" autoComplete="name" />
      <TextInput label="Email" name="email" type="email" autoComplete="email" />
      <TextInput
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={MIN_PASSWORD_LENGTH}
      />
    </AuthCardForm>
  );
}
