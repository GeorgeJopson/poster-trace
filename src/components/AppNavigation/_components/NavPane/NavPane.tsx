import React from "react";

import Logo from "@/components/Logo";
import { routeNames } from "@/routeNames";

import NavSubSection from "../../NavSubSection";
import SignOutButton from "../SignOutButton";
import styles from "./NavPane.module.css";

type NavPaneProps = {
  // Page-specific navigation, shown between the primary and footer links.
  pageNav?: React.ReactNode;
  // Hide when the logo is already shown nearby, as in the mobile drawer.
  showLogo?: boolean;
};

export default function NavPane({ pageNav, showLogo = true }: NavPaneProps) {
  return (
    <nav className={styles.navPane} aria-label="Main">
      {showLogo && <Logo showTitle={false} />}
      <NavSubSection
        title="General"
        links={[
          { name: "Campaigns", href: routeNames.dashboard },
          { name: "Register", href: routeNames.register },
        ]}
      />
      {pageNav}
      <div className={styles.footerLinks}>
        <NavSubSection
          title="Settings"
          links={[{ name: "Account", href: routeNames.account }]}
        >
          <SignOutButton />
        </NavSubSection>
      </div>
    </nav>
  );
}
