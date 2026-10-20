import type { Metadata } from "next";

import AuthCard from "@/components/AuthCard";

import RequestPasswordResetForm from "./_components/RequestPasswordResetForm";
import { PublicNavBarSpacer } from "@/components/PublicNavigation";

export const metadata: Metadata = {
  title: "Reset password",
};

// Open to everyone.
export default function PasswordResetPage() {
  return (
    <>
      <PublicNavBarSpacer />
      <AuthCard heading="Reset password">
        <RequestPasswordResetForm />
      </AuthCard>
    </>
  );
}
