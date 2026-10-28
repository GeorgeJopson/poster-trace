import { cache } from "react";

import { getCampaignService } from "@di/container";
import { withSignInRedirect } from "@/utils/withSignInRedirect";

/**
 * The signed-in user's campaign, or `null` if it doesn't exist or isn't
 * theirs. Cached so the navigation pane and the page share one query per
 * request.
 */
export const getCampaign = cache((campaignId: string) =>
  withSignInRedirect(() => getCampaignService().getMyCampaign(campaignId)),
);
