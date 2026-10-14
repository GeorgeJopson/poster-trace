import "server-only";
import { Resend } from "resend";
import PasswordResetEmail from "./templates/PasswordResetEmail";

// The only module that talks to Resend. Until a domain is verified in Resend,
// the fallback sender only delivers to the Resend account's own address.
const from = process.env.EMAIL_FROM || "Poster Trace <onboarding@resend.dev>";

// Created on first send rather than at import, because the Resend constructor
// throws without an API key and `next build` imports this module.
let resend: Resend | undefined;
function getResend() {
  resend ??= new Resend(process.env.RESEND_KEY);
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
  // Resend returns errors instead of throwing them.
  const { error } = await getResend().emails.send({
    from,
    to,
    subject: "Reset your Poster Trace password",
    react: PasswordResetEmail({ name, url }),
  });
  if (error) {
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
}
