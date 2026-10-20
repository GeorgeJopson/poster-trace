"use client";
import Image from "next/image";
import Link from "next/link";

import DashedCard from "@/components/DashedCard";
import DesignPreview from "@/components/DesignPreview";
import { icons } from "@/imageDetails";
import { routeNames } from "@/routeNames";
import type { CampaignWithDesigns } from "@/data/campaigns";

import styles from "./CampaignCard.module.css";
import useHoverRotation from "@/utils/useHoverRotation";
import { animated } from "@react-spring/web";

const IMAGE_WIDTH = 150;
const ROOT_2 = 1.4142;

interface CampaignCardProps {
  campaign: CampaignWithDesigns;
}

const wrapperClassByCount: Record<number, string> = {
  1: styles.posterDesignImageWrapperCount1,
  2: styles.posterDesignImageWrapperCount2,
  3: styles.posterDesignImageWrapperCount3,
};

export default function CampaignCard({ campaign }: CampaignCardProps) {
  const posterDesigns = campaign.posterDesigns.slice(0, 3);

  const [style, hoverHandlers] = useHoverRotation({ rotation: 10 });

  return (
    <div className={styles.boopWrapper} {...hoverHandlers}>
      <DashedCard
        as={Link}
        href={routeNames.campaign(campaign.id)}
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
        {posterDesigns.length > 0 && (
          <div
            className={`${styles.posterDesignImageWrapper} ${wrapperClassByCount[posterDesigns.length] ?? ""}`}
          >
            {posterDesigns.map((posterDesign) => (
              <DesignPreview
                key={posterDesign.id}
                width={IMAGE_WIDTH}
                height={Math.round(IMAGE_WIDTH * ROOT_2)}
                posterDesign={posterDesign}
                url={campaign.target}
                aria-label={campaign.name}
                className={styles.posterDesignImage}
              />
            ))}
          </div>
        )}
      </DashedCard>
    </div>
  );
}
