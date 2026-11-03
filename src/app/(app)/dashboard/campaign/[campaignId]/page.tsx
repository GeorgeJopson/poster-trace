import { notFound } from "next/navigation";

import CentralColumn from "@/components/CentralColumn";

import { getCampaign } from "./getCampaign";
import { CampaignProvider } from "./_components/CampaignContext";
import CampaignHeader from "./_components/CampaignHeader/CampaignHeader";
import PosterDesigns from "./_components/PosterDesigns/PosterDesigns";

export default async function CampaignPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const campaign = await getCampaign(campaignId);
  if (!campaign) {
    notFound();
  }

  return (
    <CentralColumn>
      <CampaignProvider id={campaign.id} target={campaign.target}>
        <CampaignHeader campaign={campaign} />
        <PosterDesigns
          posterDesigns={campaign.posterDesigns}
          target={campaign.target}
        />
      </CampaignProvider>
    </CentralColumn>
  );
}
