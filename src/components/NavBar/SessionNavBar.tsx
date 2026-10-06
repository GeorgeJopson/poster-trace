"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { routeNames } from "@/routeNames";
import LoggedInNavBar from "./LoggedInNavBar";
import LoggedOutNavBar from "./LoggedOutNavBar";

// Checks the session in the browser so the root layout doesn't read request
// headers, which would make every page (including the landing page) render
// on demand instead of being served statically from the CDN.
export default function SessionNavBar() {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();

  // The dashboard layout already redirects signed-out users, so skip the
  // logged-out flash there while the session request is in flight.
  const isLoggedIn =
    pathname.startsWith(routeNames.dashboard) || Boolean(session);

  return isLoggedIn ? <LoggedInNavBar /> : <LoggedOutNavBar />;
}
