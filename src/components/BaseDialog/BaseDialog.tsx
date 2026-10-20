"use client";

import IconButton from "@/components/IconButton";
import { icons } from "@/imageDetails";
import * as RadixDialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";

import styles from "./BaseDialog.module.css";

export interface BaseDialogProps {
  trigger: ReactNode;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// The trigger, overlay and an unstyled content box shared by CentralDialog
// and SlideDownDialog, which position and style the content.
export default function BaseDialog({
  trigger,
  children,
  open,
  onOpenChange,
  contentClassName,
}: BaseDialogProps & { contentClassName: string }) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Trigger asChild>{trigger}</RadixDialog.Trigger>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className={styles.dialogOverlay} />
        <RadixDialog.Content
          className={`${styles.dialogContent} ${contentClassName}`}
        >
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

export function DialogCloseButton() {
  return (
    <RadixDialog.Close asChild>
      <IconButton label="Close" iconSrc={icons.x.src} iconSize={22} />
    </RadixDialog.Close>
  );
}
