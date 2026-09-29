"use client";

import React, { createContext, useContext } from "react";

type Campaign = {
  id: number;
  target: string;
};

const CampaignContext = createContext<Campaign | null>(null);

export function CampaignProvider({
  id,
  target,
  children,
}: Campaign & { children: React.ReactNode }) {
  return (
    <CampaignContext.Provider value={{ id, target }}>
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

export function useCampaignTarget() {
  return useCampaign().target;
}
