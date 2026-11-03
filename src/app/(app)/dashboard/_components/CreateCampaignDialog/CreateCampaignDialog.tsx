"use client";

import { validateCampaignTarget } from "@application/validation/validateCampaignTarget";
import { CampaignTarget } from "@domain/campaign/CampaignTarget";
import Button from "@/components/Button";
import CentralDialog from "@/components/CentralDialog";
import NewItemButton from "@/components/NewItemButton";
import { DEFAULT_TARGET } from "@/utils/drawPoster";

import { createCampaign } from "./actions";
import styles from "./CreateCampaignDialog.module.css";

export default function CreateCampaignDialog() {
  return (
    <CentralDialog
      title="Create new campaign"
      trigger={
        <NewItemButton
          label="New Poster Campaign"
          className={styles.newCampaignButton}
        />
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
            required
            maxLength={CampaignTarget.MAX_LENGTH}
            defaultValue={DEFAULT_TARGET}
            onChange={(event) =>
              event.currentTarget.setCustomValidity(
                validateCampaignTarget(event.currentTarget.value) ?? "",
              )
            }
          />
        </div>

        <div className={styles.submitButtonWrapper}>
          <Button variant={"filled"} fontSize={"1.5rem"} type="submit">
            Submit
          </Button>
        </div>
      </form>
    </CentralDialog>
  );
}
