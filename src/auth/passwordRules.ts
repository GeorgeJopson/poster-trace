// Matches Better Auth's default minPasswordLength.
export const MIN_PASSWORD_LENGTH = 8;

// The request form waits this long before allowing another password reset
// email, which also keeps users under Better Auth's limit of 3 requests per 60
// seconds per IP.
export const RESET_EMAIL_INTERVAL_SECONDS = 60;

// At most one password reset email per account in this time (see
// src/auth/auth.ts). A little shorter than the form's wait, so a retry as soon
// as the countdown ends isn't silently skipped because of timer or clock
// differences between the browser and Netlify Function instances.
export const RESET_EMAIL_COOLDOWN_SECONDS = RESET_EMAIL_INTERVAL_SECONDS - 5;
