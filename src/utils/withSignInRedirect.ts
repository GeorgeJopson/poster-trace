import { redirect, unstable_rethrow } from "next/navigation";

import { NotAuthenticatedError } from "@application/errors/NotAuthenticatedError";
import { routeNames } from "@/routeNames";

/**
 * Runs `fn`, a call to an application service, sending the user to log in if
 * they aren't signed in (e.g. their session ran out mid-use). Every page,
 * layout and Server Action calls services through this: layouts don't
 * re-render on client navigation, and Server Actions don't run through them,
 * so the (app) layout's check isn't enough on its own.
 */
export async function withSignInRedirect<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    // Let notFound() and redirect() called inside `fn` through.
    unstable_rethrow(error);
    if (error instanceof NotAuthenticatedError) {
      redirect(routeNames.signIn);
    }
    throw error;
  }
}
