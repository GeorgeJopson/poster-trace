import styles from "./ShrinkOnHoverWrapper.module.css";
import React from "react";

export default function ShrinkOnHoverWrapper({children}:{children:React.ReactNode}) {
  return (
    <div className={styles.wrapper}>
      {children}
    </div>
  );
}