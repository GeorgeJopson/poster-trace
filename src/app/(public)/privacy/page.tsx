import type { Metadata } from "next";

import UnderConstruction from "@/components/UnderConstruction";
import { PublicNavBarSpacer } from "@/components/PublicNavigation";

export const metadata: Metadata = {
  title: "Privacy",
};

export default function PrivacyPage() {
  return (
    <>
      <PublicNavBarSpacer />
      <UnderConstruction />
    </>
  );
}
