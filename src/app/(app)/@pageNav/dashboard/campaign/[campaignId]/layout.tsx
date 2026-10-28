import React from "react";

import NavSubSection from "@/components/AppNavigation/NavSubSection";
import { routeNames } from "@/routeNames";

import { getCampaign } from "@/app/(app)/dashboard/campaign/[campaignId]/getCampaign";

// Shows the campaign's own pages in the navigation pane on both the Create
// and Analytics routes.
export default async function CampaignPageNavLayout({
  children,
  params,
}: LayoutProps<"/dashboard/campaign/[campaignId]">) {
  const { campaignId } = await params;
  const campaign = await getCampaign(campaignId);
  // Invalid or unknown campaigns render nothing here; the page itself
  // raises the 404.
  if (!campaign) {
    return null;
  }

  return (
    <>
      <NavSubSection
        title={campaign.name}
        links={[
          { name: "Create", href: routeNames.campaign(campaign.id) },
          {
            name: "Analytics",
            href: routeNames.campaignAnalytics(campaign.id),
          },
        ]}
      />
      {children}
    </>
  );
}
