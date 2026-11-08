import type { Metadata } from "next";

import CentralColumn from "@/components/CentralColumn";
import Header from "@/components/Header";
import { PublicNavBarSpacer } from "@/components/PublicNavigation";

import styles from "./Register.module.css";
import QrCodeReader from "./_components/QrCodeReader";

export const metadata: Metadata = {
  title: "Register a Poster",
};

// Public, so helpers without an account can register the posters they put up.
export default function RegisterPage() {
  return (
    <>
      <PublicNavBarSpacer />
      <CentralColumn>
        <div className={styles.wrapper}>
          <Header variant="heading">Register a Poster</Header>
          <p className={styles.text}>
            Point your camera at a poster&apos;s QR code.
          </p>
          <QrCodeReader />
        </div>
      </CentralColumn>
    </>
  );
}
