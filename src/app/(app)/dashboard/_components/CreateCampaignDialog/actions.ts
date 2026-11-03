"use server";

import { redirect } from "next/navigation";

import { getCampaignService } from "@di/container";
import { routeNames } from "@/routeNames";
import { withSignInRedirect } from "@/utils/withSignInRedirect";

export async function createCampaign(formData: FormData) {
  return withSignInRedirect(async () => {
    const name = String(formData.get("name") ?? "");
    const target = String(formData.get("target") ?? "");

    const campaign = await getCampaignService().createCampaign({
      name,
      target,
    });

    redirect(routeNames.campaign(campaign.id));
  });
}
