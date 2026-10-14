import Link from "next/link";

import AuthCard from "@/components/AuthCard";
import { routeNames } from "@/routeNames";

import styles from "./InvalidResetLink.module.css";

// Shown for a missing, expired, already-used or tampered reset token.
export default function InvalidResetLink() {
  return (
    <AuthCard heading="Link expired">
      <p className={styles.message}>
        This password reset link is invalid or has expired. Links work once and
        expire after 1 hour.
      </p>
      <p className={styles.message}>
        <Link href={routeNames.passwordReset}>Send another reset email</Link>
      </p>
    </AuthCard>
  );
}
