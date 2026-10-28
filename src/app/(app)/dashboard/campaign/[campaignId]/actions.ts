"use server";

import { revalidatePath } from "next/cache";

import { getCampaignService, getPosterDesignService } from "@di/container";
import { routeNames } from "@/routeNames";
import { withSignInRedirect } from "@/utils/withSignInRedirect";

export async function updateCampaign(campaignId: string, formData: FormData) {
  return withSignInRedirect(async () => {
    const name = String(formData.get("name") ?? "");
    const target = String(formData.get("target") ?? "");

    await getCampaignService().updateCampaign(campaignId, { name, target });

    revalidatePath(routeNames.campaign(campaignId));
  });
}

export async function createPosterDesign(
  campaignId: string,
  formData: FormData,
) {
  return withSignInRedirect(async () => {
    const image = formData.get("image");
    if (!(image instanceof File)) {
      throw new Error("A poster image is required");
    }

    // Validated by the service, which rejects NaN, so a missing or
    // non-numeric value fails there.
    await getPosterDesignService().createPosterDesign(campaignId, {
      image,
      qrPlacement: {
        x: parseFloat(String(formData.get("x"))),
        y: parseFloat(String(formData.get("y"))),
        size: parseFloat(String(formData.get("size"))),
        rotation: parseFloat(String(formData.get("rotation"))),
      },
    });

    revalidatePath(routeNames.campaign(campaignId));
  });
}
