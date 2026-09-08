import React from 'react';
import Link from "next/link";
import Image from "next/image";
import styles from "./Logo.module.css";

export default function Logo() {
  return (
      <Link className={styles.logoWrapper} href={"/"}>
        <Image width={36} height={36} src={"/logo.svg"} alt={"Poster Trace Logo"}/>
        <p className={styles.logoTitle}>PosterTrace</p>
      </Link>
  );
}
