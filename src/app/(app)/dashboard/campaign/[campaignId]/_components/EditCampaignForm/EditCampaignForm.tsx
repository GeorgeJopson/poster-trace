"use client";

import { useTransition } from "react";

import type { CampaignDto } from "@application/dto/CampaignDto";
import { validateCampaignTarget } from "@application/validation/validateCampaignTarget";
import { CampaignTarget } from "@domain/campaign/CampaignTarget";
import Button from "@/components/Button";

import { updateCampaign } from "../../actions";
import styles from "./EditCampaignForm.module.css";

interface EditCampaignFormProps {
  campaign: CampaignDto;
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
          maxLength={CampaignTarget.MAX_LENGTH}
          defaultValue={campaign.target}
          onChange={(event) =>
            event.currentTarget.setCustomValidity(
              validateCampaignTarget(event.currentTarget.value) ?? "",
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
