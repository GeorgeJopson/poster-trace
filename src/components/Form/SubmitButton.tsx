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
  // Disables the button and shows it greyed out, without the pending text.
  disabled?: boolean;
  variant?: ButtonVariant;
}) {
  return (
    <div className={styles.submitButtonWrapper}>
      <Button
        variant={disabled ? "disabled" : variant}
        fontSize={"1.25rem"}
        type="submit"
        disabled={isPending || disabled}
      >
        {isPending ? isPendingText : children}
      </Button>
    </div>
  );
}
