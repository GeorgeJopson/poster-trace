import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getMyCampaign } from "@/data/campaigns";

export const metadata: Metadata = {
  title: "Analytics",
};

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const id = Number(campaignId);
  if (!Number.isInteger(id)) {
    notFound();
  }

  const campaign = await getMyCampaign(id);
  if (!campaign) {
    notFound();
  }

  return null;
}
