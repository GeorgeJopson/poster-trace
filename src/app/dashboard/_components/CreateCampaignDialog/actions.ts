"use server";

import { redirect } from "next/navigation";

import prisma from "@/lib/prisma";

export async function createCampaign(formData: FormData) {
  const name = String(formData.get("name") ?? "");
  const target = String(formData.get("target") ?? "");

  const campaign = await prisma.posterCampaign.create({
    data: { name, target },
  });

  redirect(`/dashboard/campaign/${campaign.id}`);
}
