import "server-only";

// Kept apart from the sending code so checking config doesn't load Resend or
// the templates. Until a domain is verified in Resend, the fallback sender only
// delivers to the Resend account's own address, so it's only used in
// development.
const from =
  process.env.EMAIL_FROM ||
  (process.env.NODE_ENV === "production"
    ? undefined
    : "Poster Trace <onboarding@resend.dev>");

// Emails are sent after the response (see infrastructure/auth/betterAuth.ts), where errors are
// only logged. Callers check this first so missing config fails the request
// instead.
export function getEmailConfig() {
  const apiKey = process.env.RESEND_KEY;
  if (!apiKey) return { error: "RESEND_KEY isn't set" } as const;
  if (!from) return { error: "EMAIL_FROM isn't set" } as const;
  return { error: null, apiKey, from };
}
