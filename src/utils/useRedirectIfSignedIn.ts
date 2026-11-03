import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { ClientAccountService } from "@clientApplication/services/ClientAccountService";

// Sends visitors who already have a session (including one just created on
// the current page) straight to `route`.
export default function useRedirectIfSignedIn(route: string) {
  const router = useRouter();
  const isSignedIn = ClientAccountService.useIsSignedIn();

  useEffect(() => {
    if (isSignedIn) {
      router.push(route);
    }
  }, [isSignedIn, router, route]);
}
