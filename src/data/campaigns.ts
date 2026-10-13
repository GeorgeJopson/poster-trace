import "server-only";

import { cache } from "react";
import { and, eq } from "drizzle-orm";

import db from "@/db";
import { posterCampaign } from "@/db/schema";
import { requireUserId } from "@/auth/session";
import {
  type CampaignFields,
  validateCampaignFields,
} from "@/data/campaignValidation";
import {
  posterDesignsWithoutImageKey,
  withDesignUrl,
} from "@/data/posterDesigns";

// Every query here is scoped to the signed-in user. A campaign owned by
// someone else is treated exactly like one that doesn't exist, so callers
// can't use IDs to probe for other users' campaigns.

export async function getMyCampaigns() {
  const userId = await requireUserId();
  const campaigns = await db.query.posterCampaign.findMany({
    where: { userId },
    with: { posterDesigns: posterDesignsWithoutImageKey },
  });
  return campaigns.map((campaign) => ({
    ...campaign,
    posterDesigns: campaign.posterDesigns.map(withDesignUrl),
  }));
}

export type CampaignWithDesigns = Awaited<
  ReturnType<typeof getMyCampaigns>
>[number];

// Cached so the navigation pane and the page share one query per request.
export const getMyCampaign = cache(async (campaignId: number) => {
  const userId = await requireUserId();
  const campaign = await db.query.posterCampaign.findFirst({
    where: { id: campaignId, userId },
    with: { posterDesigns: posterDesignsWithoutImageKey },
  });
  return (
    campaign && {
      ...campaign,
      posterDesigns: campaign.posterDesigns.map(withDesignUrl),
    }
  );
});

export async function createCampaign(data: CampaignFields) {
  const userId = await requireUserId();
  const [campaign] = await db
    .insert(posterCampaign)
    .values({ ...validateCampaignFields(data), userId })
    .returning();
  return campaign;
}

export async function updateCampaign(campaignId: number, data: CampaignFields) {
  const userId = await requireUserId();
  const updated = await db
    .update(posterCampaign)
    .set(validateCampaignFields(data))
    .where(
      and(eq(posterCampaign.id, campaignId), eq(posterCampaign.userId, userId)),
    )
    .returning({ id: posterCampaign.id });
  if (updated.length === 0) {
    throw new Error("Campaign not found");
  }
}
