import { beforeEach, describe, expect, it, vi } from "vitest";

import { ClientAccountService } from "@clientApplication/services/ClientAccountService";

// Better Auth's browser client. With useSession mocked, the service's hooks
// call no real React hooks, so they can be called directly.
const authClient = vi.hoisted(() => ({
  useSession: vi.fn(),
}));
vi.mock("@infrastructure/auth/authClient", () => ({ authClient }));

const signedIn = {
  data: { user: { email: "a@example.com" }, session: {} },
  isPending: false,
};
const loading = { data: null, isPending: true };
const signedOut = { data: null, isPending: false };

beforeEach(() => {
  vi.resetAllMocks();
});

describe("ClientAccountService", () => {
  describe("useUserEmail", () => {
    it("gives the signed-in user's email", () => {
      authClient.useSession.mockReturnValue(signedIn);

      expect(ClientAccountService.useUserEmail()).toBe("a@example.com");
    });

    it("gives an empty string while the session loads", () => {
      authClient.useSession.mockReturnValue(loading);

      expect(ClientAccountService.useUserEmail()).toBe("");
    });

    it("gives an empty string when signed out", () => {
      authClient.useSession.mockReturnValue(signedOut);

      expect(ClientAccountService.useUserEmail()).toBe("");
    });
  });

  describe("useIsSignedIn", () => {
    it("is true when signed in", () => {
      authClient.useSession.mockReturnValue(signedIn);

      expect(ClientAccountService.useIsSignedIn()).toBe(true);
    });

    it("is false while the session loads", () => {
      authClient.useSession.mockReturnValue(loading);

      expect(ClientAccountService.useIsSignedIn()).toBe(false);
    });

    it("is false when signed out", () => {
      authClient.useSession.mockReturnValue(signedOut);

      expect(ClientAccountService.useIsSignedIn()).toBe(false);
    });
  });
});
