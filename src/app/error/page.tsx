import Link from "next/link";

const ERROR_MESSAGES: Record<string, string> = {
  no_code:
    "Google didn't return an authorization code. Please try signing in again.",
  oauth_provider_not_found: "This sign-in provider isn't configured.",
  issuer_missing: "The identity provider didn't return an issuer.",
  issuer_mismatch:
    "The identity provider's issuer didn't match what we expected.",
  invalid_code: "That sign-in link is invalid or has expired.",
  nonce_binding_missing:
    "We couldn't verify this sign-in attempt. Please try again.",
  unable_to_get_user_info:
    "We couldn't retrieve your account details from Google.",
  no_callback_url: "We couldn't determine where to send you after signing in.",
  unable_to_link_account:
    "This account couldn't be linked to your existing account.",
  email_does_not_match:
    "The email returned by Google doesn't match your account.",
  account_already_linked_to_different_user:
    "This Google account is already linked to a different user.",
  email_not_found: "Google didn't return an email address for this account.",
  email_not_verified: "Your Google email address isn't verified.",
  state_not_found: "This sign-in attempt expired. Please try again.",
  invalid_callback_request: "This sign-in link is invalid.",
};

export default async function ErrorPage(props: PageProps<"/error">) {
  const { error, error_description: errorDescription } =
    await props.searchParams;
  const code = Array.isArray(error) ? error[0] : error;
  const description = Array.isArray(errorDescription)
    ? errorDescription[0]
    : errorDescription;

  const message =
    (code && ERROR_MESSAGES[code]) ||
    "Something went wrong while signing you in.";

  return (
    <div>
      <p>{message}</p>
      {description ? <p>{description}</p> : null}
      <Link href="/sign-in">Back to sign in</Link>
    </div>
  );
}
