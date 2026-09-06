import React from 'react';
import styles from "./CentralColumn.module.css";

function CentralColumn({children}) {
  return <div className={styles.wrapper}>
    <div className={styles.spacer}/>
    <div className={styles.centralDiv}>{children}</div>
    <div className={styles.spacer}/>
  </div>;
}

export default CentralColumn;
