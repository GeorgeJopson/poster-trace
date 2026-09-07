import React from 'react';
import Logo from "@/components/Logo";
import Link from "next/link";
import CentralColumn from "@/components/CentralColumn";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer>
      <CentralColumn>
        <div className={styles.wrapper}>
          <Logo/>
          <nav className={styles.linkRow} aria-label="Product">
            <Link className={styles.footerLink} href="/">Log In</Link>
            <Link className={styles.footerLink} href="/">Sign Up</Link>
            <Link className={styles.footerLink} href="/">Campaign Manager</Link>
            <Link className={styles.footerLink} href="/">Poster Activation</Link>
            <Link className={styles.footerLink} href="/">Analytics Dashboard</Link>
          </nav>
          <nav className={styles.linkRow} aria-label="Company">
            <Link className={styles.footerLink} href="/">Contact</Link>
            <Link className={styles.footerLink} href="/">Privacy</Link>
            <Link className={styles.footerLink} href="/">Terms</Link>
          </nav>
        </div>
      </CentralColumn>
    </footer>
  );
}
