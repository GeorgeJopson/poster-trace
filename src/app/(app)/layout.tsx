import React from "react";
import { requireUserId } from "@/auth/session";
import MobileNav from "@/components/AppNav/MobileNav";
import NavPane from "@/components/AppNav/NavPane";
import Footer from "@/components/Footer";

import styles from "./AppLayout.module.css";

type AppLayoutProps = Readonly<{
  children: React.ReactNode;
  // Page-specific navigation from the @pageNav slot.
  pageNav: React.ReactNode;
}>;

export default async function AppLayout({ children, pageNav }: AppLayoutProps) {
  await requireUserId();
  return (
    <div className={styles.grid}>
      <aside className={styles.navColumn}>
        {/* Both are server-rendered; CSS shows one per breakpoint. */}
        <div className={styles.desktopNav}>
          <NavPane pageNav={pageNav} />
        </div>
        <div className={styles.mobileNav}>
          <MobileNav>
            <NavPane pageNav={pageNav} />
          </MobileNav>
        </div>
      </aside>
      <div className={styles.contentColumn}>
        <main className={styles.main}>{children}</main>
        <Footer />
      </div>
    </div>
  );
}
