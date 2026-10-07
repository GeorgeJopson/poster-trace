"use client";

import { icons } from "@/imageDetails";
import type { PosterCampaign } from "@/db/schema";
import Image from "next/image";
import { useState } from "react";
import { animated } from "react-spring";

import Dialog from "@/components/Dialog";
import useBoop from "@/utils/useBoop";
import EditCampaignForm from "../EditCampaignForm/EditCampaignForm";
import styles from "./EditCampaignDialog.module.css";

interface EditCampaignDialogProps {
  campaign: PosterCampaign;
}

export default function EditCampaignDialog({
  campaign,
}: EditCampaignDialogProps) {
  const [open, setOpen] = useState(false);
  const [boopStyle, trigger] = useBoop({ rotation: 25 });

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title="Edit campaign"
      trigger={
        <button
          className={styles.settingsButton}
          onMouseEnter={trigger}
          aria-label="Edit campaign"
        >
          <animated.span style={boopStyle} className={styles.settingsIcon}>
            <Image
              width={24}
              height={24}
              src={icons.settings.src}
              alt={icons.settings.alt}
            />
          </animated.span>
        </button>
      }
    >
      <EditCampaignForm campaign={campaign} onSaved={() => setOpen(false)} />
    </Dialog>
  );
}
