import React from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./Logo.module.css";

type LogoProps = {
  href?: string;
  // Show the "PosterTrace" wordmark next to the mark.
  showTitle?: boolean;
};

export default function Logo({ href = "/", showTitle = true }: LogoProps) {
  return (
    <Link className={styles.logoWrapper} href={href}>
      <Image
        width={36}
        height={36}
        src={"/logo.svg"}
        alt={"Poster Trace Logo"}
      />
      {showTitle && <p className={styles.logoTitle}>PosterTrace</p>}
    </Link>
  );
}
