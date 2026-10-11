import React from "react";

import Logo from "@/components/Logo";
import { routeNames } from "@/routeNames";

import NavLink from "../NavLink";
import SignOutButton from "../SignOutButton";
import styles from "./NavPane.module.css";

type NavPaneProps = {
  // Page-specific navigation, shown between the primary and footer links.
  pageNav?: React.ReactNode;
};

export default function NavPane({ pageNav }: NavPaneProps) {
  return (
    <nav className={styles.navPane} aria-label="Main">
      <Logo href={routeNames.dashboard} showTitle={false} />
      <div className={styles.linkGroup}>
        <NavLink href={routeNames.dashboard}>Campaigns</NavLink>
        <NavLink href={routeNames.register}>Register</NavLink>
      </div>
      {pageNav}
      <div className={`${styles.linkGroup} ${styles.footerLinks}`}>
        <NavLink href={routeNames.account}>Account</NavLink>
        <SignOutButton />
      </div>
    </nav>
  );
}
