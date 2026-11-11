import { ValidationError } from "../shared/ValidationError";
import { isUuid } from "../shared/uuid";

/** A scan's id: a UUID the domain generates when the scan is added. */
export type ScanId = string & { readonly __brand: "ScanId" };
export const ScanId = {
  generate(): ScanId {
    return crypto.randomUUID() as ScanId;
  },
  from(value: string): ScanId {
    if (!isUuid(value)) throw new ValidationError("Invalid scan id");
    return value as ScanId;
  },
  /** `null` if `raw` isn't a UUID. */
  parse(raw: string): ScanId | null {
    return isUuid(raw) ? (raw as ScanId) : null;
  },
};
