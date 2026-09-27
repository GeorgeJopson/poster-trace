"use client";

import Button from "@/components/Button";
import { Dialog } from "radix-ui";
import { useState } from "react";

import styles from "./CreateCampaignDialog.module.css";

export default function CreateCampaignDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Button
        variant={"filled"}
        fontSize={"2rem"}
        onClick={() => setOpen(true)}
      >
        Create New Campaign
      </Button>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.dialogOverlay} />
        <Dialog.Content className={styles.dialogContent}>
          <Dialog.Title>
            Create new campaign
          </Dialog.Title>
            <label htmlFor="campaignName">
              Campaign Name
            </label>
            <input
              id="campaignName"
              defaultValue="My Amazing Campaign"
            />
            <label htmlFor="target">
              Target URL
            </label>
            <input
              id="target"
              defaultValue="https://www.campaigns.com"
            />

            <Dialog.Close asChild>
              <button className={styles.Button}>Save changes</button>
            </Dialog.Close>
          <Dialog.Close asChild>
            <button className={styles.IconButton} aria-label="Close">
              X
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
