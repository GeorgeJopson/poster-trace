import React from 'react';
import Logo from "@/components/Logo";
import Link from "next/link";
import CentralColumn from "@/components/CentralColumn";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <CentralColumn>
      <div className={styles.wrapper}>
        <Logo/>
        <div className={styles.linkRow}>
          <Link className={styles.footerLink} href="/">Log In</Link>
          <Link className={styles.footerLink} href="/">Sign Up</Link>
          <Link className={styles.footerLink} href="/">Campaign Manager</Link>
          <Link className={styles.footerLink} href="/">Poster Activation</Link>
          <Link className={styles.footerLink} href="/">Analytics Dashboard</Link>
        </div>
        <div className={styles.linkRow}>
          <Link className={styles.footerLink} href="/">Contact</Link>
          <Link className={styles.footerLink} href="/">Privacy</Link>
          <Link className={styles.footerLink} href="/">Terms</Link>
        </div>
      </div>
    </CentralColumn>
  );
}
