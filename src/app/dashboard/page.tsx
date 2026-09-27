import CentralColumn from "@/components/CentralColumn";
import prisma from "@/lib/prisma";

import styles from "./Dashboard.module.css";
import Link from "next/link";
import Image from "next/image";
import {icons} from "@/imageDetails";
import React from "react";

const IMAGE_WIDTH = 150;
const ROOT_2 = 1.4142;

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
                <Image
                    className={styles.plusSymbol}
                    width={28}
                    height={28}
                    src={icons.plus.src}
                    alt={icons.plus.alt}
                />
                <h2 className={styles.cardTitle}>{campaign.name}</h2>

                <div
                className={`${styles.posterDesignImageWrapper} ${wrapperClass ?? ""}`}
              >
                {posterDesigns.map((posterDesign) => (
                  <Image
                    key={posterDesign.id}
                    width={IMAGE_WIDTH}
                    height={Math.round(IMAGE_WIDTH * ROOT_2)}
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
