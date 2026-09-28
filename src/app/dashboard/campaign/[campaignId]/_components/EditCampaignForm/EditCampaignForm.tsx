import Button from "@/components/Button";
import type { PosterCampaignModel } from "@/generated/prisma/models";

import { updateCampaign } from "../../actions";
import styles from "./EditCampaignForm.module.css";

interface EditCampaignFormProps {
  campaign: PosterCampaignModel;
}

export default function EditCampaignForm({ campaign }: EditCampaignFormProps) {
  const updateCampaignWithId = updateCampaign.bind(null, campaign.id);

  return (
    <form className={styles.card} action={updateCampaignWithId}>
      <h2 className={styles.title}>Edit campaign</h2>
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
          defaultValue={campaign.target}
        />
      </div>

      <div className={styles.submitButtonWrapper}>
        <Button variant={"filled"} fontSize={"1.5rem"} type="submit">
          Save changes
        </Button>
      </div>
    </form>
  );
}
