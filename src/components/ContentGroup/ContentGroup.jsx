import React from "react";
import styles from "./ContentGroup.module.css";

export default function ContentGroup({children, className}) {
  return (
    <div className={className ? `${styles.contentGroup} ${className}` : styles.contentGroup}>
      {children}
    </div>
  );
}
