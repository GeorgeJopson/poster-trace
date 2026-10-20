"use client";

import BlurredGlass from "@/components/BlurredGlass";
import CentralColumn from "@/components/CentralColumn";
import { icons } from "@/imageDetails";
import * as RadixDialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import Image from "next/image";
import type { ReactNode } from "react";

import styles from "./Dialog.module.css";

interface DialogProps {
  trigger: ReactNode;
  title: string;
  // Hides the title visually, keeping it for screen readers.
  hideTitle?: boolean;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  // "drawer" anchors the dialog to the top edge at full width on blurred glass,
  // with its content in a CentralColumn to line up with the page.
  variant?: "centered" | "drawer";
}

export default function Dialog({
  trigger,
  title,
  hideTitle = false,
  children,
  open,
  onOpenChange,
  variant = "centered",
}: DialogProps) {
  const closeButton = (
    <RadixDialog.Close asChild>
      <button className={styles.iconButton} aria-label="Close">
        <Image width={22} height={22} src={icons.x.src} alt={icons.x.alt} />
      </button>
    </RadixDialog.Close>
  );

  const body = (
    <>
      {hideTitle ? (
        <>
          <VisuallyHidden asChild>
            <RadixDialog.Title>{title}</RadixDialog.Title>
          </VisuallyHidden>
          <div className={styles.floatingClose}>{closeButton}</div>
        </>
      ) : (
        <div className={styles.dialogHeader}>
          <RadixDialog.Title className={styles.title}>
            {title}
          </RadixDialog.Title>
          {closeButton}
        </div>
      )}
      {children}
    </>
  );

  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Trigger asChild>{trigger}</RadixDialog.Trigger>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className={styles.dialogOverlay} />
        <RadixDialog.Content
          className={`${styles.dialogContent} ${variant === "drawer" ? styles.drawer : ""}`}
        >
          {variant === "drawer" ? (
            <BlurredGlass
              className={styles.drawerGlass}
              backgroundOpacity={0.8}
            >
              <CentralColumn>{body}</CentralColumn>
            </BlurredGlass>
          ) : (
            body
          )}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
