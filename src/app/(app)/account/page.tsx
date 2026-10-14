import type { Metadata } from "next";
import Link from "next/link";

import CentralColumn from "@/components/CentralColumn";
import { getCurrentUser } from "@/data/users";
import { routeNames } from "@/routeNames";

import styles from "./Account.module.css";
import DeleteAccountDialog from "./_components/DeleteAccountDialog";

export const metadata: Metadata = {
  title: "Account",
};

export default async function AccountPage() {
  const { name, email } = await getCurrentUser();
  return (
    <CentralColumn>
      <div className={styles.userDetailsWrapper}>
        <dl className={styles.userDetails}>
          <dt>Name</dt>
          <dd>{name}</dd>
          <dt>Email</dt>
          <dd>{email}</dd>
        </dl>
        <Link className={styles.resetLink} href={routeNames.passwordReset}>
          Reset my password
        </Link>
      </div>
      <DeleteAccountDialog />
    </CentralColumn>
  );
}
