/** Postgres's error code for a foreign key violation. */
export const FOREIGN_KEY_VIOLATION = "23503";

/** Whether `error`, or the driver error Drizzle wrapped in it, has `code`. */
export function hasPgCode(error: unknown, code: string): boolean {
  for (
    let e = error;
    e instanceof Object;
    e = (e as { cause?: unknown }).cause
  ) {
    if ((e as { code?: unknown }).code === code) return true;
  }
  return false;
}
