import React from "react";
import styles from "./List.module.css";

export default function List({children}:{children:Array<React.ReactNode>}) {
    if(!children) return null;
  return (
      <ol className={styles.listWrapper}>
        {children.map((child:React.ReactNode, index:number) =>
          <li className={styles.listItem} key={index}>
            <span className={styles.listItemContent}>
              {child}
            </span>
          </li>
        )}
      </ol>
  );
}
