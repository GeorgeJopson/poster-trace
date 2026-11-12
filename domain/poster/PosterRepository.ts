import type { Poster } from "./Poster";
import type { PosterId } from "./PosterId";

/**
 * Stores posters. It never checks ownership: callers check the poster's design
 * belongs to the user first (see ADR-0009).
 */
export interface PosterRepository {
  /**
   * Stores the poster, or the posters all or none, with any registration.
   * It only ever inserts: nothing already stored is updated, so a mutation
   * that changes a stored poster or registration needs `save` to grow an
   * update path first (ADR-0018). Saving a stored registration again is
   * fine, but if someone else registered the poster since it was loaded,
   * theirs is kept, nothing is written and it throws `AlreadyRegisteredError`
   * (ADR-0016).
   */
  save(poster: Poster): Promise<void>;
  save(posters: readonly Poster[]): Promise<void>;

  /** The poster with its registration, or `null` if there's no such poster. */
  findById(id: PosterId): Promise<Poster | null>;
}
