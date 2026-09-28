"use client";

import Button from "@/components/Button";
import Dialog from "@/components/Dialog";

import { createCampaign } from "./actions";
import styles from "./CreateCampaignDialog.module.css";

export default function CreateCampaignDialog() {
  return (
    <Dialog
      title="Create new campaign"
      trigger={
        <Button variant={"filled"} fontSize={"2rem"} textWrap={"wrap"}>
          Create New Campaign
        </Button>
      }
    >
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
    </Dialog>
  );
}
