import React from "react";

import NavPane from "../_components/NavPane";
import styles from "./AppDesktopNav.module.css";

type AppDesktopNavProps = {
  // Page-specific navigation from the @pageNav slot.
  pageNav?: React.ReactNode;
};

// The navigation pane shown in full, hidden at the breakpoint where
// AppMobileNav takes over.
export default function AppDesktopNav({ pageNav }: AppDesktopNavProps) {
  return (
    <div className={styles.desktopNav}>
      <NavPane pageNav={pageNav} />
    </div>
  );
}
