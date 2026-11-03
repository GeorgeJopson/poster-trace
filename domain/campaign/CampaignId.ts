import { ValidationError } from "../shared/ValidationError";
import { isUuid } from "../shared/uuid";

/** A campaign's id: a UUID the domain generates when the campaign is created. */
export type CampaignId = string & { readonly __brand: "CampaignId" };
export const CampaignId = {
  generate(): CampaignId {
    return crypto.randomUUID() as CampaignId;
  },
  from(value: string): CampaignId {
    if (!isUuid(value)) throw new ValidationError("Invalid campaign id");
    return value as CampaignId;
  },
  /** For ids from URLs: `null` if `raw` isn't a UUID, so callers can 404. */
  parse(raw: string): CampaignId | null {
    return isUuid(raw) ? (raw as CampaignId) : null;
  },
};
