"use client";

import { useSearchParams } from "next/navigation";

import styles from "./ResetSuccessNotice.module.css";

// Shown after /password-reset/authorized sends the user here with
// ?reset=success.
export default function ResetSuccessNotice() {
  const searchParams = useSearchParams();

  if (searchParams.get("reset") !== "success") {
    return null;
  }

  return (
    <p className={styles.notice} role="status">
      Password updated, log in with your new password.
    </p>
  );
}
