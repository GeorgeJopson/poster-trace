/**
 * Where a poster was put up, exactly as the browser reported it. The domain
 * puts no rules on it; the application layer checks it (see #40).
 */
export type RegistrationLocation = {
  readonly latitude: number;
  readonly longitude: number;
  /** In metres. */
  readonly accuracy: number;
};

/**
 * The record that a poster has been put up. A value object owned by its
 * poster, with no id of its own: the poster's id identifies it, and it never
 * changes once it's made (see ADR-0016).
 */
export type Registration = {
  readonly posterName: string;
  readonly registeredAt: Date;
  readonly location: RegistrationLocation | null;
};
