import "server-only";
import { Resend } from "resend";
import { getEmailConfig } from "./config";
import PasswordResetEmail from "./templates/PasswordResetEmail";

// The only module that talks to Resend. Import it lazily, so it's only loaded
// when an email is sent.

// Created on first send rather than at import, because the Resend constructor
// throws without an API key.
let resend: Resend | undefined;
function getResend(apiKey: string) {
  resend ??= new Resend(apiKey);
  return resend;
}

export async function sendPasswordResetEmail({
  to,
  name,
  url,
}: {
  to: string;
  name: string;
  url: string;
}) {
  const config = getEmailConfig();
  if (config.error) {
    throw new Error(`Can't send password reset email: ${config.error}`);
  }

  // Resend returns errors instead of throwing them.
  const { error } = await getResend(config.apiKey).emails.send({
    from: config.from,
    to,
    subject: "Reset your Poster Trace password",
    react: PasswordResetEmail({ name, url }),
  });
  if (error) {
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
}
