import type { Metadata } from "next";

import { getSession } from "@/auth/session";
import AuthCard from "@/components/AuthCard";

import RequestPasswordResetForm from "./_components/RequestPasswordResetForm";

export const metadata: Metadata = {
  title: "Reset password",
};

// Open to everyone. Signed-in users (e.g. from the account page) get their
// email filled in.
export default async function PasswordResetPage() {
  const session = await getSession();
  return (
    <AuthCard heading="Reset password">
      <RequestPasswordResetForm defaultEmail={session?.user.email ?? ""} />
    </AuthCard>
  );
}
