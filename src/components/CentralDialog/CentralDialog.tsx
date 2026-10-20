"use client";

import BaseDialog, {
  type BaseDialogProps,
  DialogCloseButton,
} from "@/components/BaseDialog";
import * as RadixDialog from "@radix-ui/react-dialog";

import styles from "./CentralDialog.module.css";

interface CentralDialogProps extends BaseDialogProps {
  title: string;
}

// A white box near the top centre of the screen, headed by its title and a
// close button.
export default function CentralDialog({
  title,
  children,
  ...props
}: CentralDialogProps) {
  return (
    <BaseDialog contentClassName={styles.content} {...props}>
      <div className={styles.header}>
        <RadixDialog.Title className={styles.title}>{title}</RadixDialog.Title>
        <DialogCloseButton />
      </div>
      {children}
    </BaseDialog>
  );
}
