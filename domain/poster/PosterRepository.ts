import type { Poster } from "./Poster";

/**
 * Stores posters. It never checks ownership: callers check the poster's design
 * belongs to the user first (see ADR-0009).
 */
export interface PosterRepository {
  /** Stores posters made by `Poster.generate`, all or none. */
  addAll(posters: readonly Poster[]): Promise<void>;
}
