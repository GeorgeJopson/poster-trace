"use client";

import { icons } from "@/imageDetails";
import type { PosterCampaignModel } from "@/generated/prisma/models";
import { Dialog } from "radix-ui";
import Image from "next/image";
import { useState } from "react";
import { animated } from "react-spring";

import useBoop from "@/utils/useBoop";
import EditCampaignForm from "../EditCampaignForm/EditCampaignForm";
import styles from "./EditCampaignDialog.module.css";

interface EditCampaignDialogProps {
  campaign: PosterCampaignModel;
}

export default function EditCampaignDialog({
  campaign,
}: EditCampaignDialogProps) {
  const [open, setOpen] = useState(false);
  const [boopStyle, trigger] = useBoop({ rotation: 25 });

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
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
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.dialogOverlay} />
        <Dialog.Content className={styles.dialogContent}>
          <div className={styles.dialogHeader}>
            <Dialog.Title className={styles.title}>
              Edit campaign
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className={styles.iconButton} aria-label="Close">
                <Image
                  width={22}
                  height={22}
                  src={icons.x.src}
                  alt={icons.x.alt}
                />
              </button>
            </Dialog.Close>
          </div>
          <EditCampaignForm
            campaign={campaign}
            onSaved={() => setOpen(false)}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
