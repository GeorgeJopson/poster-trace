import type { Metadata } from "next";

import UnderConstruction from "@/components/UnderConstruction";
import pageStyles from "@/app/(public)/PublicPage.module.css";

export const metadata: Metadata = {
  title: "Register",
};

export default function RegisterPage() {
  return (
    <div className={pageStyles.page}>
      <UnderConstruction />
    </div>
  );
}
