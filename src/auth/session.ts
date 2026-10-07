import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/auth/auth";
import { routeNames } from "@/routeNames";

// Cached so every layout, page and action in a request shares one lookup.
export const getSession = cache(async () =>
  auth.api.getSession({
    headers: await headers(),
  }),
);

export async function requireUserId() {
  const session = await getSession();
  if (!session) {
    redirect(routeNames.signIn);
  }
  return session.user.id;
}
