"use client";

import React, { createContext, useContext } from "react";

type Campaign = {
  // The campaign's UUID, which the forms pass to the actions.
  id: string;
  name: string;
  target: string;
};

const CampaignContext = createContext<Campaign | null>(null);

export function CampaignProvider({
  id,
  name,
  target,
  children,
}: Campaign & { children: React.ReactNode }) {
  return (
    <CampaignContext.Provider value={{ id, name, target }}>
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

export function useCampaignTarget() {
  return useCampaign().target;
}
