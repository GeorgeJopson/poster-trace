import CentralColumn from "@/components/CentralColumn";
import prisma from "@/lib/prisma";

export default async function DashboardPage() {

    const campaigns = await prisma.posterCampaign.findMany();
    return (
        <div>
            <CentralColumn>
                {
                    campaigns.map((campaign) => <p key={campaign.id}>{campaign.name}</p>)
                }
            </CentralColumn>
        </div>
  );
}
