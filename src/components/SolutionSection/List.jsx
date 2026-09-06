import React from "react";
import styles from "./List.module.css";

export default function List({children}) {
  return (
      <ol className={styles.listWrapper}>
        {children.map((child, index) =>
          <li className={styles.listItem} key={index}>
            <span className={styles.listItemContent}>
              {child}
            </span>
          </li>
        )}
      </ol>
  );
}
