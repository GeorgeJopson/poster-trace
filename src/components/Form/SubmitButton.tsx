import styles from "./SubmitButton.module.css";
import Button, { type ButtonVariant } from "@/components/Button";
import React from "react";

export default function SubmitButton({
  children,
  isPendingText,
  isPending,
  variant = "filled",
}: {
  children: React.ReactNode;
  isPendingText: string;
  isPending: boolean;
  variant?: ButtonVariant;
}) {
  return (
    <div className={styles.submitButtonWrapper}>
      <Button
        variant={variant}
        fontSize={"1.25rem"}
        type="submit"
        disabled={isPending}
      >
        {isPending ? isPendingText : children}
      </Button>
    </div>
  );
}
