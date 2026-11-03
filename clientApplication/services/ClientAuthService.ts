import {
  authClient,
  type BetterFetchOption,
} from "@infrastructure/auth/authClient";
import {
  MIN_PASSWORD_LENGTH,
  RESET_EMAIL_INTERVAL_SECONDS,
} from "@infrastructure/auth/passwordRules";

/** Why an auth request failed. `message` is shown to the user if present. */
export type AuthError = { message?: string };

export type AuthResult = { error: AuthError | null };

/**
 * Sign-in, sign-up, sign-out and password reset, called from the browser.
 * Each request goes to the auth route handler, which sets the session cookie.
 */
export class ClientAuthService {
  static async signInWithEmail(input: {
    email: string;
    password: string;
  }): Promise<AuthResult> {
    const { error } = await authClient.signIn.email(input);
    return { error: toAuthError(error) };
  }

  /** Signing up also signs the user in. */
  static async signUpWithEmail(input: {
    name: string;
    email: string;
    password: string;
  }): Promise<AuthResult> {
    const { error } = await authClient.signUp.email(input);
    return { error: toAuthError(error) };
  }

  /**
   * Redirects to Google. Only resolves if the redirect doesn't happen, after
   * calling `onError`. The URLs must be absolute (see `SocialSignOn`).
   */
  static async signInWithGoogle({
    callbackURL,
    errorCallbackURL,
    newUserCallbackURL,
    onError,
  }: {
    callbackURL: string;
    errorCallbackURL: string;
    newUserCallbackURL: string;
    onError: (message: string) => void;
  }): Promise<void> {
    await authClient.signIn.social({
      provider: "google",
      callbackURL,
      errorCallbackURL,
      newUserCallbackURL,
      fetchOptions: {
        onError: (context) => onError(context.error.message),
      } as BetterFetchOption,
    });
  }

  static async signOut(): Promise<void> {
    await authClient.signOut();
  }

  /**
   * Emails a reset link, if an account exists for `email`. `redirectTo` is
   * the page the link opens, relative to the auth base URL.
   */
  static async requestPasswordReset(input: {
    email: string;
    redirectTo: string;
  }): Promise<AuthResult> {
    const { error } = await authClient.requestPasswordReset(input);
    return { error: toAuthError(error) };
  }

  /**
   * Sets a new password with the token from a reset link, which signs out
   * every session. `isTokenInvalid` is `true` if the token has expired or
   * been used.
   */
  static async resetPassword(input: {
    newPassword: string;
    token: string;
  }): Promise<AuthResult & { isTokenInvalid: boolean }> {
    const { error } = await authClient.resetPassword(input);
    if (error?.code === "INVALID_TOKEN") {
      return { error: null, isTokenInvalid: true };
    }
    return { error: toAuthError(error), isTokenInvalid: false };
  }

  /** The shortest password accepted when signing up or resetting. */
  static getMinPasswordLength(): number {
    return MIN_PASSWORD_LENGTH;
  }

  /** How long the reset form waits before sending another email. */
  static getResetEmailIntervalSeconds(): number {
    return RESET_EMAIL_INTERVAL_SECONDS;
  }
}

function toAuthError(
  error: { message?: string | undefined } | null,
): AuthError | null {
  return error ? { message: error.message } : null;
}
