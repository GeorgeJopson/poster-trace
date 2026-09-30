import { notFound } from "next/navigation";

import { getMyCampaign } from "@/data/campaigns";
import CentralColumn from "@/components/CentralColumn";

import { CampaignProvider } from "./_components/CampaignContext";
import CampaignHeader from "./_components/CampaignHeader/CampaignHeader";
import PosterDesigns from "./_components/PosterDesigns/PosterDesigns";

export default async function CampaignPage({
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

  return (
    <CentralColumn>
      <CampaignProvider id={campaign.id} target={campaign.target}>
        <CampaignHeader campaign={campaign} />
        <PosterDesigns posterDesigns={campaign.posterDesigns} />
      </CampaignProvider>
    </CentralColumn>
  );
}
