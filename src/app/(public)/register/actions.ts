"use server";

import type { RegistrationLocationInput } from "@application/dto/inputs";
import { getRegistrationService } from "@di/container";
import { AlreadyRegisteredError } from "@domain/poster/AlreadyRegisteredError";
import { NotFoundError } from "@domain/shared/NotFoundError";
import { ValidationError } from "@domain/shared/ValidationError";
import { withSignInRedirect } from "@/utils/withSignInRedirect";

/**
 * Why the poster couldn't be registered, or `null` if it was. Returned rather
 * than thrown, because Next.js hides a thrown error's message in production.
 */
export type RegisterPosterResult = { error: string } | { error: null };

// Public: anyone holding a poster can register it, so this never needs a
// session. It still goes through withSignInRedirect, like every action.
export async function registerPoster(
  posterId: string,
  posterName: string,
  location: RegistrationLocationInput | null,
): Promise<RegisterPosterResult> {
  return withSignInRedirect(async () => {
    // A Server Action is a public endpoint, so its arguments can be anything.
    if (typeof posterId !== "string" || typeof posterName !== "string") {
      return { error: "This registration couldn't be saved." };
    }
    try {
      await getRegistrationService().register(posterId, posterName, location);
      return { error: null };
    } catch (error) {
      if (
        error instanceof ValidationError ||
        error instanceof AlreadyRegisteredError
      ) {
        return { error: error.message };
      }
      if (error instanceof NotFoundError) {
        return {
          error: "Poster Trace doesn't recognise this poster.",
        };
      }
      throw error;
    }
  });
}
