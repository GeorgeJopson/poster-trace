"use client";

import BaseDialog, {
  type BaseDialogProps,
  DialogCloseButton,
} from "@/components/BaseDialog";
import * as RadixDialog from "@radix-ui/react-dialog";

import styles from "./CentralDialog.module.css";

interface CentralDialogProps extends BaseDialogProps {
  title: string;
  /** Grows the box to the screen's full height, and as wide as its content
   * needs, for content that should be as big as it can be. */
  expanded?: boolean;
}

// A white box near the top centre of the screen, headed by its title and a
// close button.
export default function CentralDialog({
  title,
  expanded = false,
  children,
  ...props
}: CentralDialogProps) {
  return (
    <BaseDialog
      contentClassName={`${styles.content} ${expanded ? styles.expanded : ""}`}
      {...props}
    >
      <div className={styles.header}>
        <RadixDialog.Title className={styles.title}>{title}</RadixDialog.Title>
        <DialogCloseButton />
      </div>
      {children}
    </BaseDialog>
  );
}
