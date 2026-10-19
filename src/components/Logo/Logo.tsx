import React from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./Logo.module.css";
import { routeNames } from "@/routeNames";

type LogoProps = {
  href?: string;
  // Show the "PosterTrace" wordmark next to the mark.
  showTitle?: boolean;
};

export default function Logo({ showTitle = true }: LogoProps) {
  return (
    <Link className={styles.logoWrapper} href={routeNames.root}>
      <Image
        width={28}
        height={28}
        src={"/logo.svg"}
        alt={"Poster Trace Logo"}
      />
      {showTitle && <p className={styles.logoTitle}>PosterTrace</p>}
    </Link>
  );
}
