import React from "react";
import { requireUserId } from "@/auth/session";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";

import styles from "./AppLayout.module.css";

type AppLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

// Temporarily renders the public NavBar + Footer so moving routes into the
// group changes nothing visually; replaced by the navigation shell later.
export default async function AppLayout({ children }: AppLayoutProps) {
  await requireUserId();
  return (
    <div className={styles.wrapper}>
      <NavBar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
