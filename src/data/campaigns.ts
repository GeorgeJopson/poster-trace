import "server-only";

import { and, eq } from "drizzle-orm";

import db from "@/db";
import { posterCampaign, posterDesign, type PosterDesign } from "@/db/schema";
import { requireUserId } from "@/lib/session";

// Every query here is scoped to the signed-in user. A campaign owned by
// someone else is treated exactly like one that doesn't exist, so callers
// can't use IDs to probe for other users' campaigns.

// Swap the raw image bytes for a data URL so designs can be rendered (and
// passed to client components) without base64-encoding in the browser.
function withDesignUrl({ design, ...rest }: PosterDesign) {
  return {
    ...rest,
    designUrl: `data:${rest.designMimeType};base64,${Buffer.from(design).toString("base64")}`,
  };
}

export type PosterDesignWithUrl = ReturnType<typeof withDesignUrl>;

export async function getMyCampaigns() {
  const userId = await requireUserId();
  const campaigns = await db.query.posterCampaign.findMany({
    where: { userId },
    with: { posterDesigns: true },
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
    with: { posterDesigns: true },
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
  data: {
    design: Uint8Array<ArrayBuffer>;
    designMimeType: string;
    qrXPosition: number;
    qrYPosition: number;
    qrSize: number;
    qrRotation: number;
  },
) {
  await assertOwnsCampaign(campaignId);
  await db
    .insert(posterDesign)
    .values({ ...data, posterCampaignId: campaignId });
}
