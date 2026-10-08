import "server-only";

import { and, eq } from "drizzle-orm";

import db from "@/db";
import { posterCampaign, posterDesign, type PosterDesign } from "@/db/schema";
import { requireUserId } from "@/auth/session";
import { deleteImage, saveImage } from "@/imageStorage";

// Every query here is scoped to the signed-in user. A campaign owned by
// someone else is treated exactly like one that doesn't exist, so callers
// can't use IDs to probe for other users' campaigns.

// Designs are loaded without their image key, so keys never reach the
// browser. /api/poster-designs/[designId]/image serves the images instead.
const posterDesignsWithoutImageKey = {
  columns: { designImageKey: false },
} as const;

function withDesignUrl(design: Omit<PosterDesign, "designImageKey">) {
  return {
    ...design,
    designUrl: `/api/poster-designs/${design.id}/image`,
  };
}

export type PosterDesignWithUrl = ReturnType<typeof withDesignUrl>;

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

export async function getMyCampaign(campaignId: number) {
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
}

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

export async function createCampaign(data: { name: string; target: string }) {
  const userId = await requireUserId();
  const [campaign] = await db
    .insert(posterCampaign)
    .values({ ...data, userId })
    .returning();
  return campaign;
}

export async function updateCampaign(
  campaignId: number,
  data: { name: string; target: string },
) {
  const userId = await requireUserId();
  const updated = await db
    .update(posterCampaign)
    .set(data)
    .where(
      and(eq(posterCampaign.id, campaignId), eq(posterCampaign.userId, userId)),
    )
    .returning({ id: posterCampaign.id });
  if (updated.length === 0) {
    throw new Error("Campaign not found");
  }
}

export async function createPosterDesign(
  campaignId: number,
  {
    image,
    ...data
  }: {
    image: File;
    qrXPosition: number;
    qrYPosition: number;
    qrSize: number;
    qrRotation: number;
  },
) {
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
