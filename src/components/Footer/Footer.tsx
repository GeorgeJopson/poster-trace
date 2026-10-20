import React from "react";
import Link from "next/link";
import CentralColumn from "@/components/CentralColumn";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer>
      <CentralColumn>
        <div className={styles.linkWrapper}>
          <nav className={styles.linkRow} aria-label="Company">
            <Link className={styles.footerLink} href="/">
              Contact
            </Link>
            <Link className={styles.footerLink} href="/">
              Privacy
            </Link>
            <Link className={styles.footerLink} href="/">
              Terms
            </Link>
          </nav>
          <p className={styles.copyright}>© {new Date().getFullYear()} PosterTrace</p>
        </div>
      </CentralColumn>
    </footer>
  );
}
