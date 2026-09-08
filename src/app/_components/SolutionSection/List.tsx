import React from "react";
import styles from "./List.module.css";

type ListProps = {
  children: React.ReactNode;
};

export default function List({children}: ListProps) {
    if(!children) return null;
  return (
      <ol className={styles.listWrapper}>
        {React.Children.toArray(children).map((child:React.ReactNode, index:number) =>
          <li className={styles.listItem} key={index}>
            <span className={styles.listItemContent}>
              {child}
            </span>
          </li>
        )}
      </ol>
  );
}
