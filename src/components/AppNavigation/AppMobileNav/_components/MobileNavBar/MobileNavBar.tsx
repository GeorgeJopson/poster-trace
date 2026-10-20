import React from "react";

import Logo from "@/components/Logo";

import styles from "./MobileNavBar.module.css";

type MobileNavBarProps = {
  button: React.ReactNode;
};

// The logo and a button at either end of a row. Shared by the page's bar and
// the open drawer, which both place it in a CentralColumn, so the menu and
// close buttons sit in the same place.
export default function MobileNavBar({ button }: MobileNavBarProps) {
  return (
    <div className={styles.contentWrapper}>
      <Logo showTitle={false} />
      {button}
    </div>
  );
}
