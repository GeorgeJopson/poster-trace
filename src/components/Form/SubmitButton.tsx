import styles from "./SubmitButton.module.css";
import Button from "@/components/Button";
import React from "react";

export default function SubmitButton({children, isPendingText, isPending}:{children: React.ReactNode, isPendingText:string ,isPending:boolean}) {
  return (
    <div className={styles.submitButtonWrapper}>
      <Button
        variant={"filled"}
        fontSize={"1.25rem"}
        type="submit"
        disabled={isPending}
      >
        {isPending ? isPendingText : children}
      </Button>
    </div>
  );
}