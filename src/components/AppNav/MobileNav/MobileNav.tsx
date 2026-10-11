"use client";

import React, { useState } from "react";
import Image from "next/image";

import Dialog from "@/components/Dialog";
import { icons } from "@/imageDetails";

import styles from "./MobileNav.module.css";

type MobileNavProps = {
  // The navigation pane, rendered on the server and shown in the dialog.
  children: React.ReactNode;
};

export default function MobileNav({ children }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  // Close when any link inside is followed, including links from the
  // server-rendered page navigation, which can't take a callback.
  function handleClick(event: React.MouseEvent<HTMLDivElement>) {
    if (event.target instanceof Element && event.target.closest("a")) {
      setOpen(false);
    }
  }

  return (
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
      <div onClick={handleClick}>{children}</div>
    </Dialog>
  );
}
