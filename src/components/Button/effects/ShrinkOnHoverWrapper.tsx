import styles from "./ShrinkOnHoverWrapper.module.css";
import React from "react";

type ShrinkOnHoverWrapperProps = {
  children: React.ReactNode;
};

export default function ShrinkOnHoverWrapper({children}: ShrinkOnHoverWrapperProps) {
  return (
    <div className={styles.wrapper}>
      {children}
    </div>
  );
}