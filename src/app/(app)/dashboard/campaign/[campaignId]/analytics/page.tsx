import type { Metadata } from "next";
import { notFound } from "next/navigation";

import UnderConstruction from "@/components/UnderConstruction";

import { getCampaign } from "../getCampaign";

export const metadata: Metadata = {
  title: "Analytics",
};

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const campaign = await getCampaign(campaignId);
  if (!campaign) {
    notFound();
  }

  return <UnderConstruction />;
}
