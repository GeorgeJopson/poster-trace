import prisma from "@/lib/prisma";
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
  const campaign = await prisma.posterCampaign.findUnique({
    where: { id: parseInt(campaignId) },
    include: { posterDesigns: true },
  });
  return (
    <CentralColumn>
      {campaign && (
        <CampaignProvider target={campaign.target}>
          <CampaignHeader campaign={campaign} />
          <PosterDesigns posterDesigns={campaign.posterDesigns} />
        </CampaignProvider>
      )}
    </CentralColumn>
  );
}
