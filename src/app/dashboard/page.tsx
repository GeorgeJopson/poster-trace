import CentralColumn from "@/components/CentralColumn";
import prisma from "@/lib/prisma";

import styles from "./Dashboard.module.css";
import Link from "next/link";
import Image from "next/image";

export default async function DashboardPage() {
  const campaigns = await prisma.posterCampaign.findMany(
      {
          include: {
              posterDesigns:true
          }
      }
  );
  return (
    <CentralColumn>
      <div className={styles.gridWrapper}>
        {campaigns.map((campaign) => {
          const posterDesigns = campaign.posterDesigns.slice(0, 3);
          const wrapperClassByCount: Record<number, string> = {
            1: styles.posterDesignImageWrapperCount1,
            2: styles.posterDesignImageWrapperCount2,
            3: styles.posterDesignImageWrapperCount3,
          };
          const wrapperClass = wrapperClassByCount[posterDesigns.length];

          return (
            <Link
              href={`/dashboard/campaign/${campaign.id}`}
              key={campaign.id}
              className={styles.campaign}
            >
                <h2 className={styles.cardTitle}>{campaign.name}</h2>

                <div
                className={`${styles.posterDesignImageWrapper} ${wrapperClass ?? ""}`}
              >
                {posterDesigns.map((posterDesign) => (
                  <Image
                    key={posterDesign.id}
                    width={150}
                    height={150 * 1.4142}
                    src={`data:image/png;base64,${posterDesign.design.toBase64()}`}
                    alt={campaign.name}
                    className={styles.posterDesignImage}
                  />
                ))}
              </div>
            </Link>
          );
        })}
      </div>
    </CentralColumn>
  );
}
