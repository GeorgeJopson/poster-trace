import "server-only";

import { and, eq } from "drizzle-orm";

import db from "@infrastructure/db/client";
import {
  posterCampaign,
  posterDesign,
  type PosterDesign,
} from "@infrastructure/db/schema";
import { requireUserId } from "@/auth/session";
import { deleteImage, saveImage } from "@infrastructure/storage";
import {
  type PosterDesignFields,
  validatePosterDesignFields,
} from "@/data/posterDesignValidation";

// Every query here is scoped to the signed-in user, through the campaign the
// design belongs to. A design in someone else's campaign is treated exactly
// like one that doesn't exist, so callers can't use IDs to probe for other
// users' designs.

// Designs are loaded without their image key, so keys never reach the
// browser. /api/poster-designs/[designId]/image serves the images instead.
export const posterDesignsWithoutImageKey = {
  columns: { designImageKey: false },
} as const;

export function withDesignUrl(design: Omit<PosterDesign, "designImageKey">) {
  return {
    ...design,
    designUrl: `/api/poster-designs/${design.id}/image`,
  };
}

export type ClientPosterDesign = ReturnType<typeof withDesignUrl>;

async function assertOwnsCampaign(campaignId: number) {
  const userId = await requireUserId();
  const campaign = await db.query.posterCampaign.findFirst({
    where: { id: campaignId, userId },
    columns: { id: true },
  });
  if (!campaign) {
    throw new Error("Campaign not found");
  }
}

export async function createPosterDesign(
  campaignId: number,
  fields: PosterDesignFields,
) {
  validatePosterDesignFields(fields);
  const { image, ...data } = fields;
  await assertOwnsCampaign(campaignId);
  const designImageKey = await saveImage(image);
  try {
    await db
      .insert(posterDesign)
      .values({ ...data, designImageKey, posterCampaignId: campaignId });
  } catch (error) {
    // Don't leave an image behind that no design points to.
    await deleteImage(designImageKey);
    throw error;
  }
}

export async function getMyPosterDesignImageKey(posterDesignId: number) {
  const userId = await requireUserId();
  const [design] = await db
    .select({ designImageKey: posterDesign.designImageKey })
    .from(posterDesign)
    .innerJoin(
      posterCampaign,
      eq(posterDesign.posterCampaignId, posterCampaign.id),
    )
    .where(
      and(
        eq(posterDesign.id, posterDesignId),
        eq(posterCampaign.userId, userId),
      ),
    );
  return design?.designImageKey;
}
