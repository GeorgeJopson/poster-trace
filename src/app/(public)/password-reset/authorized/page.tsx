import type { Metadata } from "next";

import InvalidResetLink from "./_components/InvalidResetLink";
import ResetPasswordForm from "./_components/ResetPasswordForm";
import { PublicNavBarSpacer } from "@/components/PublicNavigation";

export const metadata: Metadata = {
  title: "Choose a new password",
};

// The email links to Better Auth's /api/auth/reset-password/:token, which
// redirects here with either `token` or `error=INVALID_TOKEN`.
export default async function PasswordResetAuthorizedPage(
  props: PageProps<"/password-reset/authorized">,
) {
  const { token, error } = await props.searchParams;
  const tokenValue = Array.isArray(token) ? token[0] : token;

  return (
    <>
      <PublicNavBarSpacer />
      {error || !tokenValue ? (
        <InvalidResetLink />
      ) : (
        <ResetPasswordForm token={tokenValue} />
      )}
    </>
  );
}
