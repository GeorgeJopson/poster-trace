import React, {RefObject} from 'react';
import Button from "@/components/Button";
import Image from "next/image";
import { icons } from "@/imageDetails";
import styles from "./HeaderButtonGroup.module.css";
import {routeNames} from "@/routeNames";

interface HeaderButtonGroupProps {
  scrollToRef: RefObject<HTMLElement | null>;
}

export default function HeaderButtonGroup({scrollToRef}: HeaderButtonGroupProps) {
  return (
      <div className={styles.buttonWrapper}>
        <Button variant={"filled"} href={routeNames.signUp} fontSize={`var(--signup-btn-size)`}>Sign Up</Button>
        {/*  TODO: This should scroll user to the Problem section*/}
        <Button variant={"transparent"} href={"/"} fontSize={`var(--learn-more-btn-size)`}
            onClick={() => {
                if (scrollToRef.current) {
                    window.scrollTo({
                        behavior: 'smooth',
                        top:
                            scrollToRef.current.getBoundingClientRect().top -
                            document.body.getBoundingClientRect().top - 46,
                    })
                }
            }}
        >Learn More <Image className={styles.inlineImage} width={32} height={32} src={icons.rightArrow.src} alt={icons.rightArrow.alt}/></Button>
      </div>
  );
}
