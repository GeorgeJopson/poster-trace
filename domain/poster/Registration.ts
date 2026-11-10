import type { PosterName } from "./PosterName";
import type { RegistrationLocation } from "./RegistrationLocation";

/**
 * The record that a poster has been put up. A value object owned by its
 * poster, with no id of its own: the poster's id identifies it, and it never
 * changes once it's made (see ADR-0016). Its parts are checked by their own
 * factories.
 */
export type Registration = {
  readonly posterName: PosterName;
  readonly registeredAt: Date;
  readonly location: RegistrationLocation | null;
};
