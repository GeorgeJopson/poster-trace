import prisma from "@/lib/prisma";
import CentralColumn from "@/components/CentralColumn";

export default async function CampaignPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const campaign = await prisma.posterCampaign.findUnique({
    where: { id: parseInt(campaignId) },
  });
  return (
    <CentralColumn>
      {campaign && (
        <>
          <p>{campaign.name}</p>
          <p>{campaign.target}</p>
        </>
      )}
    </CentralColumn>
  );
}
