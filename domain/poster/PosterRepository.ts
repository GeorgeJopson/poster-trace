import type { Poster } from "./Poster";
import type { PosterId } from "./PosterId";

/**
 * Stores posters. It never checks ownership: callers check the poster's design
 * belongs to the user first (see ADR-0009).
 */
export interface PosterRepository {
  /**
   * Stores the poster, or the posters all or none, with any registration. A
   * stored poster's registration is never overwritten, so if someone else
   * registered it since it was loaded, theirs is kept and nothing is written
   * (ADR-0018).
   */
  save(poster: Poster): Promise<void>;
  save(posters: readonly Poster[]): Promise<void>;

  /** The poster with its registration, or `null` if there's no such poster. */
  findById(id: PosterId): Promise<Poster | null>;
}
