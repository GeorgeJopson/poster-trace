import React from "react";

import NavSubSection from "@/components/AppNav/NavSubSection";
import { getMyCampaign } from "@/data/campaigns";
import { routeNames } from "@/routeNames";

// Shows the campaign's own pages in the navigation pane on both the Create
// and Analytics routes.
export default async function CampaignPageNavLayout({
  children,
  params,
}: LayoutProps<"/dashboard/campaign/[campaignId]">) {
  const { campaignId } = await params;
  const id = Number(campaignId);
  // Invalid or unknown campaigns render nothing here; the page itself
  // raises the 404.
  if (!Number.isInteger(id)) {
    return null;
  }

  const campaign = await getMyCampaign(id);
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
