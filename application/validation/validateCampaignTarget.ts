import { CampaignTarget } from "@domain/campaign/CampaignTarget";

import { getValidationMessage } from "./getValidationMessage";

/** Why `value` can't be used as a campaign's target, or `null` if it can. */
export function validateCampaignTarget(value: string): string | null {
  return getValidationMessage(() => CampaignTarget.create(value));
}
