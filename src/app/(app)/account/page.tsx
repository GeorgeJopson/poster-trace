import type { Metadata } from "next";

import { getAccountService } from "@di/container";
import CentralColumn from "@/components/CentralColumn";
import PasswordResetLink from "@/components/PasswordResetLink";
import { withSignInRedirect } from "@/utils/withSignInRedirect";

import styles from "./Account.module.css";
import DeleteAccountDialog from "./_components/DeleteAccountDialog";

export const metadata: Metadata = {
  title: "Account",
};

export default async function AccountPage() {
  const { name, email } = await withSignInRedirect(() =>
    getAccountService().getCurrentUser(),
  );
  return (
    <CentralColumn>
      <div className={styles.userDetailsWrapper}>
        <dl className={styles.userDetails}>
          <dt>Name</dt>
          <dd>{name}</dd>
          <dt>Email</dt>
          <dd>{email}</dd>
        </dl>
        <PasswordResetLink className={styles.resetLink} />
      </div>
      <DeleteAccountDialog />
    </CentralColumn>
  );
}
