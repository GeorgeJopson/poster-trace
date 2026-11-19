import type { Poster } from "./Poster";
import type { PosterId } from "./PosterId";

/**
 * Stores posters. It never checks ownership: callers check the poster's design
 * belongs to the user first (see ADR-0009).
 */
export interface PosterRepository {
  /** The poster with its registration, or `null` if there's no such poster. */
  findById(id: PosterId): Promise<Poster | null>;

  /**
   * Stores whatever the posters hold, new or already stored, all or none (see
   * ADR-0018). A stored registration is never deleted, and a different one
   * replaces it: only `poster.register` stops a second registration.
   */
  save(poster: Poster): Promise<void>;
  save(posters: readonly Poster[]): Promise<void>;
}
