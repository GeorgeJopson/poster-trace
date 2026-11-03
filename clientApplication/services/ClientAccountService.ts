import { authClient } from "@infrastructure/auth/authClient";

/**
 * The signed-in user's account, read in the browser. These are React hooks:
 * call them only at the top level of a component or another hook.
 */
export class ClientAccountService {
  /** The signed-in user's email, or `""` while loading or if signed out. */
  static useUserEmail(): string {
    const { data: session } = authClient.useSession();
    return session?.user.email ?? "";
  }

  /** Whether someone is signed in. `false` while the session loads. */
  static useIsSignedIn(): boolean {
    const { data: session } = authClient.useSession();
    return Boolean(session);
  }
}
