import React from 'react';
import Button from "@/components/Button";
import Image from "next/image";
import { icons } from "@/imageDetails";
import styles from "./HeaderButtonGroup.module.css";

export default function HeaderButtonGroup() {
  return (
      <div className={styles.buttonWrapper}>
        <Button variant={"filled"} href={"/"} fontSize={`var(--signup-btn-size)`}>Sign Up</Button>
        <Button variant={"transparent"} href={"/"} fontSize={`var(--learn-more-btn-size)`}>Learn More <Image className={styles.inlineImage} width={32} height={32} src={icons.rightArrow.src} alt={icons.rightArrow.alt}/></Button>
      </div>
  );
}
