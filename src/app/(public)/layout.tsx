import React from "react";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";

import styles from "./PublicLayout.module.css";

type PublicLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className={styles.wrapper}>
      <NavBar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
