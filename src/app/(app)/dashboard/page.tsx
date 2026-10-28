import { getCampaignService } from "@di/container";
import CentralColumn from "@/components/CentralColumn";
import { withSignInRedirect } from "@/utils/withSignInRedirect";

import styles from "./Dashboard.module.css";
import CampaignCard from "./_components/CampaignCard";
import CreateCampaignDialog from "./_components/CreateCampaignDialog";

export default async function DashboardPage() {
  const campaigns = await withSignInRedirect(() =>
    getCampaignService().listMyCampaigns(),
  );
  return (
    <CentralColumn>
      <div className={styles.wrapper}>
        <div className={styles.gridWrapper}>
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
          <CreateCampaignDialog />
        </div>
      </div>
    </CentralColumn>
  );
}
