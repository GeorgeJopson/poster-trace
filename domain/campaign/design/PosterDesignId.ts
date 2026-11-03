import { ValidationError } from "../../shared/ValidationError";
import { isUuid } from "../../shared/uuid";

/** A poster design's id: a UUID the domain generates when the design is added. */
export type PosterDesignId = string & { readonly __brand: "PosterDesignId" };
export const PosterDesignId = {
  generate(): PosterDesignId {
    return crypto.randomUUID() as PosterDesignId;
  },
  from(value: string): PosterDesignId {
    if (!isUuid(value)) throw new ValidationError("Invalid poster design id");
    return value as PosterDesignId;
  },
  /** For ids from URLs: `null` if `raw` isn't a UUID, so callers can 404. */
  parse(raw: string): PosterDesignId | null {
    return isUuid(raw) ? (raw as PosterDesignId) : null;
  },
};
