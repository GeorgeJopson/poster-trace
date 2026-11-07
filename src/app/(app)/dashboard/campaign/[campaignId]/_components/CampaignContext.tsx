"use client";

import React, { createContext, useContext } from "react";

type Campaign = {
  // The campaign's UUID, which the forms pass to the actions.
  id: string;
  name: string;
  /** What previews' QR codes encode (see PosterService.sampleScanUrl). */
  sampleScanUrl: string;
};

const CampaignContext = createContext<Campaign | null>(null);

export function CampaignProvider({
  id,
  name,
  sampleScanUrl,
  children,
}: Campaign & { children: React.ReactNode }) {
  return (
    <CampaignContext.Provider value={{ id, name, sampleScanUrl }}>
      {children}
    </CampaignContext.Provider>
  );
}

function useCampaign() {
  const campaign = useContext(CampaignContext);
  if (campaign === null) {
    throw new Error("useCampaign must be used within a CampaignProvider");
  }
  return campaign;
}

export function useCampaignId() {
  return useCampaign().id;
}

export function useCampaignName() {
  return useCampaign().name;
}

export function useSampleScanUrl() {
  return useCampaign().sampleScanUrl;
}
