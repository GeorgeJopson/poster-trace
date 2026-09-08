import React from 'react';
import styles from "./CentralColumn.module.css";

type CentralColumnProps = {
  children: React.ReactNode;
};

function CentralColumn({children}: CentralColumnProps) {
  return <div className={styles.wrapper}>
    <div className={styles.spacer}/>
    <div className={styles.centralDiv}>{children}</div>
    <div className={styles.spacer}/>
  </div>;
}

export default CentralColumn;
