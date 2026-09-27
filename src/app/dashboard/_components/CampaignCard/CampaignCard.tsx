"use client";
import Image from "next/image";
import Link from "next/link";

import { icons } from "@/imageDetails";
import type { Prisma } from "@/generated/prisma/client";

import styles from "./CampaignCard.module.css";
import useBoop from "@/utils/useBoop";
import { animated } from "react-spring";

const IMAGE_WIDTH = 150;
const ROOT_2 = 1.4142;

type Campaign = Prisma.PosterCampaignGetPayload<{
  include: { posterDesigns: true };
}>;

interface CampaignCardProps {
  campaign: Campaign;
}

export default function CampaignCard({ campaign }: CampaignCardProps) {
  const posterDesigns = campaign.posterDesigns.slice(0, 3);
  const wrapperClassByCount: Record<number, string> = {
    1: styles.posterDesignImageWrapperCount1,
    2: styles.posterDesignImageWrapperCount2,
    3: styles.posterDesignImageWrapperCount3,
  };
  const wrapperClass = wrapperClassByCount[posterDesigns.length];
  const [style, trigger] = useBoop({ rotation: 10 });

  return (
    <div className={styles.boopWrapper} onMouseEnter={trigger}>
      <Link
        href={`/dashboard/campaign/${campaign.id}`}
        className={styles.campaign}
      >
        <animated.span style={style} className={styles.plusSymbol}>
          <Image
            width={28}
            height={28}
            src={icons.plus.src}
            alt={icons.plus.alt}
          />
        </animated.span>

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
    </div>
  );
}
