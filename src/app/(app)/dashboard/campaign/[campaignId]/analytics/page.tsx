import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getAnalyticsService } from "@di/container";
import Button from "@/components/Button";
import CentralColumn from "@/components/CentralColumn";
import { routeNames } from "@/routeNames";
import { withSignInRedirect } from "@/utils/withSignInRedirect";

import { getCampaign } from "../getCampaign";
import ScanDistribution from "./_components/ScanDistribution";
import TopPosters from "./_components/TopPosters";
import styles from "./Analytics.module.css";

export const metadata: Metadata = {
  title: "Analytics",
};

/** How many posters the top posters list shows. */
const TOP_POSTERS = 5;

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const campaign = await getCampaign(campaignId);
  if (!campaign) {
    notFound();
  }
  const analytics = getAnalyticsService();
  const [distribution, topPosters] = await withSignInRedirect(() =>
    Promise.all([
      analytics.getScanDistribution(campaign.id),
      analytics.getTopPosters(campaign.id, TOP_POSTERS),
    ]),
  );
  const designIds = campaign.posterDesigns.map((design) => design.id);

  return (
    <CentralColumn>
      <div className={styles.wrapper}>
        {distribution.length === 0 ? (
          <div className={styles.empty}>
            <p>Generate posters to see analytics.</p>
            <Button
              variant="filled"
              fontSize="1rem"
              href={routeNames.campaign(campaign.id)}
            >
              Back to campaign
            </Button>
          </div>
        ) : (
          <>
            <ScanDistribution
              distribution={distribution}
              designIds={designIds}
            />
            <TopPosters posters={topPosters} designIds={designIds} />
          </>
        )}
      </div>
    </CentralColumn>
  );
}
