const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/**
 * Whether `value` is a UUID in its canonical, lower-case form, as
 * `crypto.randomUUID()` and Postgres write them. Ids are compared with `===`,
 * so other spellings of the same UUID aren't accepted.
 */
export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}
