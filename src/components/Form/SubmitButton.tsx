import styles from "./SubmitButton.module.css";
import Button, { type ButtonVariant } from "@/components/Button";
import React from "react";

export default function SubmitButton({
  children,
  isPendingText,
  isPending,
  disabled = false,
  variant = "filled",
}: {
  children: React.ReactNode;
  isPendingText: string;
  isPending: boolean;
  // Disables the button without showing the pending text.
  disabled?: boolean;
  variant?: ButtonVariant;
}) {
  return (
    <div className={styles.submitButtonWrapper}>
      <Button
        variant={variant}
        fontSize={"1.25rem"}
        type="submit"
        disabled={isPending || disabled}
      >
        {isPending ? isPendingText : children}
      </Button>
    </div>
  );
}
