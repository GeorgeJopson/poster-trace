import CentralColumn from "@/components/CentralColumn";
import prisma from "@/lib/prisma";

import styles from "./Dashboard.module.css";
import Link from "next/link";

export default async function DashboardPage() {
  const campaigns = await prisma.posterCampaign.findMany();
  return (
    <CentralColumn>
      <div className={styles.gridWrapper}>
        {campaigns.map((campaign) => (
          <Link
            href={`/dashboard/campaign/${campaign.id}`}
            key={campaign.id}
            className={styles.campaign}
          >
            <h2 className={styles.cardTitle}>{campaign.name}</h2>
          </Link>
        ))}
      </div>
    </CentralColumn>
  );
}
