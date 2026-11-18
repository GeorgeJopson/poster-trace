"use server";

import type { RegistrationLocationInput } from "@application/dto/inputs";
import type { PosterCheckDto } from "@application/dto/PosterCheckDto";
import { getRegistrationService } from "@di/container";
import { AlreadyRegisteredError } from "@domain/poster/AlreadyRegisteredError";
import { NotFoundError } from "@domain/shared/NotFoundError";
import { ValidationError } from "@domain/shared/ValidationError";
import { withSignInRedirect } from "@/utils/withSignInRedirect";

// Public: anyone holding a poster can register it, so neither action ever
// needs a session. They still go through withSignInRedirect, like every action.

/** Whether the poster that was read is unknown, registered or unregistered. */
export async function checkPoster(posterId: string): Promise<PosterCheckDto> {
  return withSignInRedirect(async () => {
    // A Server Action is a public endpoint, so its arguments can be anything.
    if (typeof posterId !== "string") return "unknown";
    return getRegistrationService().checkPoster(posterId);
  });
}

/**
 * How registering went. `"invalid"` carries an error the helper can fix by
 * submitting again. `"registered"` and `"unknown"` mean the poster itself
 * can't be registered (someone registered it, or it stopped existing, after it
 * was read), so the page shows that poster check's dialog instead. Returned
 * rather than thrown, because Next.js hides a thrown error's message in
 * production.
 */
export type RegisterPosterResult =
  | { outcome: "saved" }
  | { outcome: "invalid"; error: string }
  | { outcome: Exclude<PosterCheckDto, "unregistered"> };

export async function registerPoster(
  posterId: string,
  posterName: string,
  location: RegistrationLocationInput | null,
): Promise<RegisterPosterResult> {
  return withSignInRedirect(async () => {
    if (typeof posterId !== "string" || typeof posterName !== "string") {
      return {
        outcome: "invalid",
        error: "This registration couldn't be saved.",
      };
    }
    try {
      await getRegistrationService().register(posterId, posterName, location);
      return { outcome: "saved" };
    } catch (error) {
      if (error instanceof ValidationError) {
        return { outcome: "invalid", error: error.message };
      }
      if (error instanceof AlreadyRegisteredError) {
        return { outcome: "registered" };
      }
      if (error instanceof NotFoundError) return { outcome: "unknown" };
      throw error;
    }
  });
}
