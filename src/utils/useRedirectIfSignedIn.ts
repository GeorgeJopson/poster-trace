import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { AccountService } from "@clientApplication/services/AccountService";

// Sends visitors who already have a session (including one just created on
// the current page) straight to `route`.
export default function useRedirectIfSignedIn(route: string) {
  const router = useRouter();
  const isSignedIn = AccountService.useIsSignedIn();

  useEffect(() => {
    if (isSignedIn) {
      router.push(route);
    }
  }, [isSignedIn, router, route]);
}
