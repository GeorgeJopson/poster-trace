import { notFound } from "next/navigation";

import { getPosterService } from "@di/container";
import CentralColumn from "@/components/CentralColumn";
import { withSignInRedirect } from "@/utils/withSignInRedirect";

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
  const sampleScanUrl = await withSignInRedirect(async () =>
    getPosterService().sampleScanUrl(),
  );

  return (
    <CentralColumn>
      <CampaignProvider
        id={campaign.id}
        name={campaign.name}
        sampleScanUrl={sampleScanUrl}
      >
        <CampaignHeader campaign={campaign} />
        <PosterDesigns posterDesigns={campaign.posterDesigns} />
      </CampaignProvider>
    </CentralColumn>
  );
}
