import CentralColumn from "@/components/CentralColumn";
import prisma from "@/lib/prisma";

import styles from "./Dashboard.module.css";
import CampaignCard from "./_components/CampaignCard";

export default async function DashboardPage() {
  const campaigns = await prisma.posterCampaign.findMany({
    include: {
      posterDesigns: true,
    },
  });
  return (
    <CentralColumn>
      <div className={styles.gridWrapper}>
        {campaigns.map((campaign) => (
          <CampaignCard key={campaign.id} campaign={campaign} />
        ))}
      </div>
    </CentralColumn>
  );
}
