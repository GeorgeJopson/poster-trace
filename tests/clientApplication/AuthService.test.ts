import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthService } from "@clientApplication/services/AuthService";
import {
  MIN_PASSWORD_LENGTH,
  RESET_EMAIL_INTERVAL_SECONDS,
} from "@infrastructure/auth/passwordRules";

// Better Auth's browser client, which would send real requests.
const authClient = vi.hoisted(() => ({
  signIn: { email: vi.fn(), social: vi.fn() },
  signUp: { email: vi.fn() },
  signOut: vi.fn(),
  requestPasswordReset: vi.fn(),
  resetPassword: vi.fn(),
}));
vi.mock("@infrastructure/auth/authClient", () => ({ authClient }));

beforeEach(() => {
  vi.resetAllMocks();
});

describe("AuthService", () => {
  it("signs in with email", async () => {
    authClient.signIn.email.mockResolvedValue({ data: {}, error: null });

    const result = await AuthService.signInWithEmail({
      email: "a@example.com",
      password: "password",
    });

    expect(authClient.signIn.email).toHaveBeenCalledWith({
      email: "a@example.com",
      password: "password",
    });
    expect(result).toEqual({ error: null });
  });

  it("returns only the message of a failed request", async () => {
    authClient.signUp.email.mockResolvedValue({
      data: null,
      error: { message: "User already exists", status: 422, code: "X" },
    });

    const result = await AuthService.signUpWithEmail({
      name: "A",
      email: "a@example.com",
      password: "password",
    });

    expect(result).toEqual({ error: { message: "User already exists" } });
  });

  it("signs in with Google and passes request errors to onError", async () => {
    authClient.signIn.social.mockImplementation(async ({ fetchOptions }) => {
      fetchOptions.onError({ error: { message: "Provider not found" } });
    });
    const onError = vi.fn();

    await AuthService.signInWithGoogle({
      callbackURL: "https://example.com/dashboard",
      errorCallbackURL: "https://example.com/error",
      newUserCallbackURL: "https://example.com/dashboard",
      onError,
    });

    expect(authClient.signIn.social).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "google",
        callbackURL: "https://example.com/dashboard",
        errorCallbackURL: "https://example.com/error",
        newUserCallbackURL: "https://example.com/dashboard",
      }),
    );
    expect(onError).toHaveBeenCalledWith("Provider not found");
  });

  it("requests a password reset", async () => {
    authClient.requestPasswordReset.mockResolvedValue({
      data: {},
      error: null,
    });

    const result = await AuthService.requestPasswordReset({
      email: "a@example.com",
      redirectTo: "/password-reset/authorized",
    });

    expect(authClient.requestPasswordReset).toHaveBeenCalledWith({
      email: "a@example.com",
      redirectTo: "/password-reset/authorized",
    });
    expect(result).toEqual({ error: null });
  });

  describe("resetPassword", () => {
    it("succeeds", async () => {
      authClient.resetPassword.mockResolvedValue({ data: {}, error: null });

      const result = await AuthService.resetPassword({
        newPassword: "new-password",
        token: "token",
      });

      expect(result).toEqual({ error: null, isTokenInvalid: false });
    });

    it("reports an expired or used token separately from other errors", async () => {
      authClient.resetPassword.mockResolvedValue({
        data: null,
        error: { message: "Invalid token", code: "INVALID_TOKEN" },
      });

      const result = await AuthService.resetPassword({
        newPassword: "new-password",
        token: "token",
      });

      expect(result).toEqual({ error: null, isTokenInvalid: true });
    });

    it("returns other errors", async () => {
      authClient.resetPassword.mockResolvedValue({
        data: null,
        error: { message: "Password too short", code: "PASSWORD_TOO_SHORT" },
      });

      const result = await AuthService.resetPassword({
        newPassword: "short",
        token: "token",
      });

      expect(result).toEqual({
        error: { message: "Password too short" },
        isTokenInvalid: false,
      });
    });
  });

  it("gives the password rules", () => {
    expect(AuthService.getMinPasswordLength()).toBe(MIN_PASSWORD_LENGTH);
    expect(AuthService.getResetEmailIntervalSeconds()).toBe(
      RESET_EMAIL_INTERVAL_SECONDS,
    );
  });
});
