import type { Metadata } from "next";

import UnderConstruction from "@/components/UnderConstruction";
import { PublicNavBarSpacer } from "@/components/PublicNavigation";

export const metadata: Metadata = {
  title: "Contact",
};

export default function ContactPage() {
  return (
    <>
      <PublicNavBarSpacer />
      <UnderConstruction />
    </>
  );
}
