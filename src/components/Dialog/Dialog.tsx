"use client";

import BlurredGlass from "@/components/BlurredGlass";
import CentralColumn from "@/components/CentralColumn";
import IconButton from "@/components/IconButton";
import { icons } from "@/imageDetails";
import * as RadixDialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import type { ReactNode } from "react";

import styles from "./Dialog.module.css";

interface DialogProps {
  trigger: ReactNode;
  title: string;
  // Replaces the default header of title and close button with a custom
  // layout around the close button. The title is then kept only for screen
  // readers.
  renderHeader?: (closeButton: ReactNode) => ReactNode;
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
  renderHeader,
  children,
  open,
  onOpenChange,
  variant = "centered",
}: DialogProps) {
  const closeButton = (
    <RadixDialog.Close asChild>
      <IconButton label="Close" iconSrc={icons.x.src} iconSize={22} />
    </RadixDialog.Close>
  );

  const body = (
    <>
      {renderHeader ? (
        <>
          <VisuallyHidden asChild>
            <RadixDialog.Title>{title}</RadixDialog.Title>
          </VisuallyHidden>
          {renderHeader(closeButton)}
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
              <CentralColumn>
                <div className={styles.drawerBody}>{body}</div>
              </CentralColumn>
            </BlurredGlass>
          ) : (
            body
          )}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
