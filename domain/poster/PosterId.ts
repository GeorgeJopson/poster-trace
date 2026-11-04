import { ValidationError } from "../shared/ValidationError";
import { isUuid } from "../shared/uuid";

/**
 * A poster's id: a UUID the domain generates when the poster is generated.
 * It's in the poster's QR code, so being unguessable matters.
 */
export type PosterId = string & { readonly __brand: "PosterId" };
export const PosterId = {
  generate(): PosterId {
    return crypto.randomUUID() as PosterId;
  },
  from(value: string): PosterId {
    if (!isUuid(value)) throw new ValidationError("Invalid poster id");
    return value as PosterId;
  },
  /** For ids from URLs: `null` if `raw` isn't a UUID, so callers can 404. */
  parse(raw: string): PosterId | null {
    return isUuid(raw) ? (raw as PosterId) : null;
  },
};
