"use client";

import React, { createContext, useContext } from "react";

const CampaignTargetContext = createContext<string | null>(null);

export function CampaignProvider({
  target,
  children,
}: {
  target: string;
  children: React.ReactNode;
}) {
  return (
    <CampaignTargetContext.Provider value={target}>
      {children}
    </CampaignTargetContext.Provider>
  );
}

export function useCampaignTarget() {
  const target = useContext(CampaignTargetContext);
  if (target === null) {
    throw new Error("useCampaignTarget must be used within a CampaignProvider");
  }
  return target;
}
