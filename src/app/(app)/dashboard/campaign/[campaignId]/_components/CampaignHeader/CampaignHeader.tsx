import Link from "next/link";
import type { CampaignDto } from "@application/dto/CampaignDto";

import EditCampaignDialog from "../EditCampaignDialog/EditCampaignDialog";
import styles from "./CampaignHeader.module.css";

interface CampaignHeaderProps {
  campaign: CampaignDto;
}

export default function CampaignHeader({ campaign }: CampaignHeaderProps) {
  return (
    <div className={styles.header}>
      <div className={styles.text}>
        <h1 className={styles.title}>{campaign.name}</h1>
        <Link
          href={campaign.target}
          className={styles.target}
          target="_blank"
          rel="noopener noreferrer"
        >
          {campaign.target}
        </Link>
      </div>
      <EditCampaignDialog campaign={campaign} />
    </div>
  );
}
