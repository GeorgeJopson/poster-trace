import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/auth/auth-client";
import { routeNames } from "@/routeNames";

// Sends visitors who already have a session (including one just created by
// signing in on this page) straight to the dashboard.
export default function useRedirectIfSignedIn() {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (session) {
      router.push(routeNames.dashboard);
    }
  }, [session, router]);
}
