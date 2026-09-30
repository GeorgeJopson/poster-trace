"use client";

import { icons } from "@/imageDetails";
import { Dialog as RadixDialog } from "radix-ui";
import Image from "next/image";
import type { ReactNode } from "react";

import styles from "./Dialog.module.css";

interface DialogProps {
  trigger: ReactNode;
  title: string;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function Dialog({
  trigger,
  title,
  children,
  open,
  onOpenChange,
}: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Trigger asChild>{trigger}</RadixDialog.Trigger>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className={styles.dialogOverlay} />
        <RadixDialog.Content className={styles.dialogContent}>
          <div className={styles.dialogHeader}>
            <RadixDialog.Title className={styles.title}>
              {title}
            </RadixDialog.Title>
            <RadixDialog.Close asChild>
              <button className={styles.iconButton} aria-label="Close">
                <Image
                  width={22}
                  height={22}
                  src={icons.x.src}
                  alt={icons.x.alt}
                />
              </button>
            </RadixDialog.Close>
          </div>
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
