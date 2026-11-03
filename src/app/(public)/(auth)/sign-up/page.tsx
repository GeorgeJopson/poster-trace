"use client";

import Link from "next/link";

import { ClientAuthService } from "@clientApplication/services/ClientAuthService";
import AuthCardForm from "@/components/AuthCardForm";
import { TextInput } from "@/components/Form";
import { routeNames } from "@/routeNames";
import { PublicNavBarSpacer } from "@/components/PublicNavigation";

export default function SignUp() {
  return (
    <>
      <PublicNavBarSpacer />
      <AuthCardForm
        actionName="Sign Up"
        pendingText="Signing Up …"
        fallbackErrorMessage="Something went wrong signing up. Please try again."
        // Signing up also signs the user in.
        submit={(formData) =>
          ClientAuthService.signUpWithEmail({
            name: String(formData.get("name")),
            email: String(formData.get("email")),
            password: String(formData.get("password")),
          })
        }
        switchPrompt={
          <>
            Already have an account?{" "}
            <Link href={routeNames.signIn}>Log in</Link>
          </>
        }
      >
        <TextInput label="Name" name="name" autoComplete="name" />
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
          autoComplete="new-password"
          minLength={ClientAuthService.getMinPasswordLength()}
        />
      </AuthCardForm>
    </>
  );
}
