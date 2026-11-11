import type { Poster } from "./Poster";
import type { PosterId } from "./PosterId";

/**
 * Stores posters. It never checks ownership: callers check the poster's design
 * belongs to the user first (see ADR-0009).
 */
export interface PosterRepository {
  /** Stores posters made by `Poster.generate`, all or none. */
  addAll(posters: readonly Poster[]): Promise<void>;

  /**
   * The poster with its registration but without its stored scans, or `null`
   * if there's no such poster.
   */
  findById(id: PosterId): Promise<Poster | null>;

  /**
   * Stores the poster's new scans. It only ever inserts: stored scans are
   * never changed or deleted (see ADR-0015). Call it once per loaded poster:
   * the poster keeps its new scans, so a second call fails on their ids.
   */
  addNewScans(poster: Poster): Promise<void>;

  /**
   * Stores the poster's registration. It only ever inserts (see ADR-0016): if
   * the poster already has a stored registration, e.g. because someone else
   * registered it at the same moment, it throws `AlreadyRegisteredError`.
   */
  addRegistration(poster: Poster): Promise<void>;
}
