"use client";

import { useTransition } from "react";

import Button from "@/components/Button";
import type { PosterCampaign } from "@infrastructure/db/schema";
import { getTargetError, MAX_TARGET_LENGTH } from "@/data/campaignValidation";

import { updateCampaign } from "../../actions";
import styles from "./EditCampaignForm.module.css";

interface EditCampaignFormProps {
  campaign: PosterCampaign;
  onSaved?: () => void;
}

export default function EditCampaignForm({
  campaign,
  onSaved,
}: EditCampaignFormProps) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await updateCampaign(campaign.id, formData);
      onSaved?.();
    });
  }

  return (
    <form className={styles.form} action={handleSubmit}>
      <div className={styles.fields}>
        <label className={styles.label} htmlFor="campaignName">
          Campaign Name
        </label>
        <input
          className={styles.input}
          id="campaignName"
          name="name"
          defaultValue={campaign.name}
        />

        <label className={styles.label} htmlFor="target">
          Target URL
        </label>
        <input
          className={styles.input}
          id="target"
          name="target"
          required
          maxLength={MAX_TARGET_LENGTH}
          defaultValue={campaign.target}
          onChange={(event) =>
            event.currentTarget.setCustomValidity(
              getTargetError(event.currentTarget.value.trim()) ?? "",
            )
          }
        />
      </div>

      <div className={styles.submitButtonWrapper}>
        <Button
          variant={"filled"}
          fontSize={"1.5rem"}
          type="submit"
          disabled={isPending}
        >
          Save changes
        </Button>
      </div>
    </form>
  );
}
