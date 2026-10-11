import React from "react";
import { requireUserId } from "@/auth/session";
import NavPane from "@/components/AppNav/NavPane";
import Footer from "@/components/Footer";

import styles from "./AppLayout.module.css";

type AppLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default async function AppLayout({ children }: AppLayoutProps) {
  await requireUserId();
  return (
    <div className={styles.grid}>
      <aside className={styles.navColumn}>
        <NavPane />
      </aside>
      <div className={styles.contentColumn}>
        <main className={styles.main}>{children}</main>
        <Footer />
      </div>
    </div>
  );
}
