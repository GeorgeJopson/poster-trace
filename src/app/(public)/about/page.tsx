import type { Metadata } from "next";

import UnderConstruction from "@/components/UnderConstruction";
import { PublicNavBarSpacer } from "@/components/PublicNavigation";

export const metadata: Metadata = {
  title: "About",
};

export default function AboutPage() {
  return (
    <>
      <PublicNavBarSpacer />
      <UnderConstruction />
    </>
  );
}
