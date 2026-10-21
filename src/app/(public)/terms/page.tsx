import type { Metadata } from "next";

import UnderConstruction from "@/components/UnderConstruction";
import { PublicNavBarSpacer } from "@/components/PublicNavigation";

export const metadata: Metadata = {
  title: "Terms",
};

export default function TermsPage() {
  return (
    <>
      <PublicNavBarSpacer />
      <UnderConstruction />
    </>
  );
}
