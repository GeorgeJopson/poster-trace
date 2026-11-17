import "server-only";

import { PosterId } from "@domain/poster/PosterId";
import { PosterName } from "@domain/poster/PosterName";
import type { PosterRepository } from "@domain/poster/PosterRepository";
import { RegistrationLocation } from "@domain/poster/RegistrationLocation";
import { NotFoundError } from "@domain/shared/NotFoundError";

import type { RegistrationLocationInput } from "../dto/inputs";
import type { PosterCheckDto } from "../dto/PosterCheckDto";

/**
 * Registering posters. Anyone holding a poster can register it, not just its
 * campaign's owner, so nothing here checks who's signed in.
 */
export class RegistrationService {
  constructor(
    private readonly posters: PosterRepository,
    /** The server's clock, which registrations are timed by. */
    private readonly now: () => Date = () => new Date(),
  ) {}

  /**
   * Whether Poster Trace recognises the poster and, if so, whether it's
   * registered. A malformed poster id is `"unknown"`. It reveals nothing about
   * the registration, as anyone can call it (#40, user story 14).
   */
  async checkPoster(posterId: string): Promise<PosterCheckDto> {
    const id = PosterId.parse(posterId);
    const poster = id && (await this.posters.findById(id));
    if (!poster) return "unknown";
    return poster.registration ? "registered" : "unregistered";
  }

  /**
   * Registers the poster, timed by the server's clock. The poster name is
   * trimmed. Throws `NotFoundError` if there's no such poster,
   * `AlreadyRegisteredError` if it's already registered (ADR-0016) and
   * `ValidationError` for an invalid poster name or location.
   */
  async register(
    posterId: string,
    posterName: string,
    location: RegistrationLocationInput | null,
  ): Promise<void> {
    const id = PosterId.parse(posterId);
    const poster = id && (await this.posters.findById(id));
    if (!poster) throw new NotFoundError("Poster not found");

    poster.register(
      PosterName.create(posterName),
      location && RegistrationLocation.create(location),
      this.now(),
    );
    await this.posters.createRegistration(poster);
  }
}
