import type { Metadata } from "next";

import AuthCard from "@/components/AuthCard";

import RequestPasswordResetForm from "./_components/RequestPasswordResetForm";
import pageStyles from "@/app/(public)/PublicPage.module.css";

export const metadata: Metadata = {
  title: "Reset password",
};

// Open to everyone.
export default function PasswordResetPage() {
  return (
    <div className={pageStyles.page}>
      <AuthCard heading="Reset password">
        <RequestPasswordResetForm />
      </AuthCard>
    </div>
  );
}
