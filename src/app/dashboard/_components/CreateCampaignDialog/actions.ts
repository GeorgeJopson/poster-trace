"use server";

import { redirect } from "next/navigation";

import { createCampaign as createCampaignForUser } from "@/data/campaigns";

export async function createCampaign(formData: FormData) {
  const name = String(formData.get("name") ?? "");
  const target = String(formData.get("target") ?? "");

  const campaign = await createCampaignForUser({ name, target });

  redirect(`/dashboard/campaign/${campaign.id}`);
}
