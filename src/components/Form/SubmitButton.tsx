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
  // Shows the button as disabled and blocks submitting, without the pending
  // text. Uses aria-disabled so the button keeps focus.
  disabled?: boolean;
  variant?: ButtonVariant;
}) {
  return (
    <div className={styles.submitButtonWrapper}>
      <Button
        variant={variant}
        fontSize={"1.25rem"}
        type="submit"
        disabled={isPending}
        aria-disabled={disabled || undefined}
        // Also catches pressing Enter in a field, which clicks this button.
        onClick={disabled ? (event) => event.preventDefault() : undefined}
      >
        {isPending ? isPendingText : children}
      </Button>
    </div>
  );
}
