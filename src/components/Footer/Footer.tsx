import React from "react";
import Link from "next/link";
import CentralColumn from "@/components/CentralColumn";
import { routeNames } from "@/routeNames";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer>
      <CentralColumn>
        <div className={styles.linkWrapper}>
          <nav className={styles.linkRow} aria-label="Company">
            <Link className={styles.footerLink} href={routeNames.contact}>
              Contact
            </Link>
            <Link className={styles.footerLink} href={routeNames.privacy}>
              Privacy
            </Link>
            <Link className={styles.footerLink} href={routeNames.terms}>
              Terms
            </Link>
          </nav>
          <p className={styles.copyright}>
            © {new Date().getFullYear()} PosterTrace
          </p>
        </div>
      </CentralColumn>
    </footer>
  );
}
