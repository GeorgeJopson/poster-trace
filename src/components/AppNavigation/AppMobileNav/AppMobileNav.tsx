"use client";

import React, { useState } from "react";
import Image from "next/image";

import Dialog from "@/components/Dialog";
import { icons } from "@/imageDetails";

import NavPane from "../_components/NavPane";
import styles from "./AppMobileNav.module.css";

type AppMobileNavProps = {
  // Page-specific navigation from the @pageNav slot, rendered on the server.
  pageNav?: React.ReactNode;
};

// A menu button that opens the navigation pane in a drawer, shown only at the
// breakpoint where AppDesktopNav is hidden. No padding, as the dialog adds
// its own.
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
    <div className={styles.mobileNav}>
      <Dialog
        title="Navigation"
        hideTitle
        variant="drawer"
        open={open}
        onOpenChange={setOpen}
        trigger={
          <button className={styles.menuButton} aria-label="Open navigation">
            <Image width={24} height={24} src={icons.menu.src} alt="" />
          </button>
        }
      >
        <div onClick={handleClick}>
          <NavPane pageNav={pageNav} />
        </div>
      </Dialog>
    </div>
  );
}
