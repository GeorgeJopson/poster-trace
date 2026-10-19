import type { Metadata } from "next";

import UnderConstruction from "@/components/UnderConstruction";
import pageStyles from "@/app/(public)/PublicPage.module.css";

export const metadata: Metadata = {
  title: "About",
};

export default function AboutPage() {
  return (
    <div className={pageStyles.page}>
      <UnderConstruction />
    </div>
  );
}
