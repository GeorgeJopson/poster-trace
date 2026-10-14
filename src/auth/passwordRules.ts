// Matches Better Auth's default minPasswordLength.
export const MIN_PASSWORD_LENGTH = 8;

// At most one password reset email per account in this time (see
// src/auth/auth.ts). The request form waits as long before allowing another,
// which also keeps users under Better Auth's limit of 3 requests per 60
// seconds per IP.
export const RESET_EMAIL_INTERVAL_SECONDS = 60;
