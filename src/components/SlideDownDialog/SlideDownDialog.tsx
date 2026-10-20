"use client";

import BaseDialog, {
  type BaseDialogProps,
  DialogCloseButton,
} from "@/components/BaseDialog";
import BlurredGlass from "@/components/BlurredGlass";
import CentralColumn from "@/components/CentralColumn";
import * as RadixDialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import type { ComponentType, ReactNode } from "react";

import styles from "./SlideDownDialog.module.css";

export interface SlideDownDialogHeaderProps {
  // The dialog's close button.
  button: ReactNode;
}

interface SlideDownDialogProps extends BaseDialogProps {
  // Kept only for screen readers.
  title: string;
  // Lays out the close button above the content.
  header: ComponentType<SlideDownDialogHeaderProps>;
}

// A drawer that slides down from the top edge at full width on blurred glass,
// with its content in a CentralColumn to line up with the page.
export default function SlideDownDialog({
  title,
  header: Header,
  children,
  ...props
}: SlideDownDialogProps) {
  return (
    <BaseDialog contentClassName={styles.content} {...props}>
      <BlurredGlass className={styles.glass} backgroundOpacity={0.8}>
        <CentralColumn>
          <div className={styles.body}>
            <VisuallyHidden asChild>
              <RadixDialog.Title>{title}</RadixDialog.Title>
            </VisuallyHidden>
            <Header button={<DialogCloseButton />} />
            {children}
          </div>
        </CentralColumn>
      </BlurredGlass>
    </BaseDialog>
  );
}
