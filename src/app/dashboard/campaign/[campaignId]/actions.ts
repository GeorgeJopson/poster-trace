"use server";

import { revalidatePath } from "next/cache";

import prisma from "@/lib/prisma";

export async function updateCampaign(campaignId: number, formData: FormData) {
  const name = String(formData.get("name") ?? "");
  const target = String(formData.get("target") ?? "");

  await prisma.posterCampaign.update({
    where: { id: campaignId },
    data: { name, target },
  });

  revalidatePath(`/dashboard/campaign/${campaignId}`);
}
