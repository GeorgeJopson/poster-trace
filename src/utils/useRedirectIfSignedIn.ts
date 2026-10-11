import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/auth/auth-client";

// Sends visitors who already have a session (including one just created on
// the current page) straight to `route`.
export default function useRedirectIfSignedIn(route: string) {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (session) {
      router.push(route);
    }
  }, [session, router, route]);
}
