import type { Metadata } from "next";

import UnderConstruction from "@/components/UnderConstruction";
import { PublicNavBarSpacer } from "@/components/PublicNavigation";

export const metadata: Metadata = {
  title: "Register",
};

export default function RegisterPage() {
  return (
    <>
      <PublicNavBarSpacer />
      <UnderConstruction />
    </>
  );
}
