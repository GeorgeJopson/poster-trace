import "server-only";

import type { PosterDesignModel } from "@/generated/prisma/models";
import prisma from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

// Every query here is scoped to the signed-in user. A campaign owned by
// someone else is treated exactly like one that doesn't exist, so callers
// can't use IDs to probe for other users' campaigns.

// Swap the raw image bytes for a data URL so designs can be rendered (and
// passed to client components) without base64-encoding in the browser.
function withDesignUrl({ design, ...posterDesign }: PosterDesignModel) {
  return {
    ...posterDesign,
    designUrl: `data:${posterDesign.designMimeType};base64,${Buffer.from(design).toString("base64")}`,
  };
}

export type PosterDesignWithUrl = ReturnType<typeof withDesignUrl>;

export async function getMyCampaigns() {
  const userId = await requireUserId();
  const campaigns = await prisma.posterCampaign.findMany({
    where: { userId },
    include: { posterDesigns: true },
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
  const campaign = await prisma.posterCampaign.findFirst({
    where: { id: campaignId, userId },
    include: { posterDesigns: true },
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
  const campaign = await prisma.posterCampaign.findFirst({
    where: { id: campaignId, userId },
    select: { id: true },
  });
  if (!campaign) {
    throw new Error("Campaign not found");
  }
}

export async function createCampaign(data: { name: string; target: string }) {
  const userId = await requireUserId();
  return prisma.posterCampaign.create({
    data: { ...data, userId },
  });
}

export async function updateCampaign(
  campaignId: number,
  data: { name: string; target: string },
) {
  const userId = await requireUserId();
  const { count } = await prisma.posterCampaign.updateMany({
    where: { id: campaignId, userId },
    data,
  });
  if (count === 0) {
    throw new Error("Campaign not found");
  }
}

export async function createPosterDesign(
  campaignId: number,
  data: {
    design: Uint8Array<ArrayBuffer>;
    designMimeType: string;
    qr_x_position: number;
    qr_y_position: number;
    qr_size: number;
    qr_rotation: number;
  },
) {
  await assertOwnsCampaign(campaignId);
  await prisma.posterDesign.create({
    data: { ...data, posterCampaignId: campaignId },
  });
}
