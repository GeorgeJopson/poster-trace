import type { Metadata } from "next";

import CentralColumn from "@/components/CentralColumn";
import { getCurrentUser } from "@/data/users";

import styles from "./Account.module.css";

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
      </div>
    </CentralColumn>
  );
}
