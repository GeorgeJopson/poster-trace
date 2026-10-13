"use server";

import { revalidatePath } from "next/cache";

import { updateCampaign as updateCampaignForUser } from "@/data/campaigns";
import { createPosterDesign as createPosterDesignForUser } from "@/data/posterDesigns";
import { routeNames } from "@/routeNames";

export async function updateCampaign(campaignId: number, formData: FormData) {
  const name = String(formData.get("name") ?? "");
  const target = String(formData.get("target") ?? "");

  await updateCampaignForUser(campaignId, { name, target });

  revalidatePath(routeNames.campaign(campaignId));
}

export async function createPosterDesign(
  campaignId: number,
  formData: FormData,
) {
  const image = formData.get("image");
  if (!(image instanceof File)) {
    throw new Error("A poster image is required");
  }

  // Validated by createPosterDesignForUser, which rejects NaN, so a missing
  // or non-numeric value fails there.
  await createPosterDesignForUser(campaignId, {
    image,
    qrXPosition: parseFloat(String(formData.get("qrXPosition"))),
    qrYPosition: parseFloat(String(formData.get("qrYPosition"))),
    qrSize: parseFloat(String(formData.get("qrSize"))),
    qrRotation: parseFloat(String(formData.get("qrRotation"))),
  });

  revalidatePath(routeNames.campaign(campaignId));
}
