"use client";

import Button from "@/components/Button";
import { icons } from "@/imageDetails";
import { Dialog } from "radix-ui";
import Image from "next/image";
import { useState } from "react";

import { createCampaign } from "./actions";
import styles from "./CreateCampaignDialog.module.css";

export default function CreateCampaignDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Button
        variant={"filled"}
        fontSize={"2rem"}
        textWrap={"wrap"}
        onClick={() => setOpen(true)}
      >
        Create New Campaign
      </Button>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.dialogOverlay} />
        <Dialog.Content className={styles.dialogContent}>
          <Dialog.Title className={styles.title}>
            Create new campaign
          </Dialog.Title>
          <form className={styles.form} action={createCampaign}>
            <div className={styles.fields}>
              <label className={styles.label} htmlFor="campaignName">
                Campaign Name
              </label>
              <input
                className={styles.input}
                id="campaignName"
                name="name"
                defaultValue="My Amazing Campaign"
              />

              <label className={styles.label} htmlFor="target">
                Target URL
              </label>
              <input
                className={styles.input}
                id="target"
                name="target"
                defaultValue="https://www.campaigns.com"
              />
            </div>

            <div className={styles.submitButtonWrapper}>
              <Button variant={"filled"} fontSize={"1.5rem"} type="submit">
                Submit
              </Button>
            </div>
          </form>
          <Dialog.Close asChild>
            <button className={styles.iconButton} aria-label="Close">
              <Image width={22} height={22} src={icons.x.src} alt={icons.x.alt} />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
