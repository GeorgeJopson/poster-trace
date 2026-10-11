import React from "react";
import PublicNavBar from "@/components/PublicNavigation";
import Footer from "@/components/Footer";

import styles from "./PublicLayout.module.css";

type PublicLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className={styles.wrapper}>
      <PublicNavBar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
