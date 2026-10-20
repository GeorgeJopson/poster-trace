"use client";

import React, { useState } from "react";

import BlurredGlass from "@/components/BlurredGlass";
import CentralColumn from "@/components/CentralColumn";
import IconButton from "@/components/IconButton";
import SlideDownDialog from "@/components/SlideDownDialog";
import { icons } from "@/imageDetails";

import NavPane from "../_components/NavPane";
import MobileNavBar from "./_components/MobileNavBar";
import styles from "./AppMobileNav.module.css";

type AppMobileNavProps = {
  // Page-specific navigation from the @pageNav slot, rendered on the server.
  pageNav?: React.ReactNode;
};

// A bar with the logo and a menu button that opens the navigation pane in a
// drawer from the top, shown only at the breakpoint where AppDesktopNav is
// hidden. The drawer repeats the bar with a close button in place of the menu
// button. No padding around the pane, as the dialog adds its own.
export default function AppMobileNav({ pageNav }: AppMobileNavProps) {
  const [open, setOpen] = useState(false);

  // Close when any link inside is followed, including links from the
  // server-rendered page navigation, which can't take a callback.
  function handleClick(event: React.MouseEvent<HTMLDivElement>) {
    if (event.target instanceof Element && event.target.closest("a")) {
      setOpen(false);
    }
  }

  return (
    <BlurredGlass className={styles.mobileNav}>
      <CentralColumn>
        <MobileNavBar
          button={
            <SlideDownDialog
              title="Navigation"
              open={open}
              onOpenChange={setOpen}
              renderHeader={(closeButton) => (
                <MobileNavBar button={closeButton} />
              )}
              trigger={
                <IconButton label="Open navigation" iconSrc={icons.menu.src} />
              }
            >
              <div onClick={handleClick}>
                <NavPane pageNav={pageNav} showLogo={false} />
              </div>
            </SlideDownDialog>
          }
        />
      </CentralColumn>
    </BlurredGlass>
  );
}
