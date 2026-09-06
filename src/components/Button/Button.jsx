import React from 'react';
import styles from "./Button.module.css";

export default function Button({children, type, fontSize}) {
  let typeClass;

  switch (type) {
    case "filled":
      typeClass = styles.filled;
      break;
    case "transparent":
      typeClass = styles.transparent;
      break;
    case "outline":
      typeClass = styles.outline;
      break;
    default:
      typeClass = styles.filled;
      break;
  }

  return (
    <div className={styles.buttonWrapper}>
      <button className={`${styles.btn} ${typeClass}`} style={{fontSize}}>{children}</button>
    </div>
  );
}
