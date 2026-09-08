import React from "react";
import styles from "./ProblemCard.module.css";

type ProblemCardProps = {
  icon: React.ReactElement;
  title: string;
  children: string;
};

export default function ProblemCard({icon, title, children}: ProblemCardProps) {
  return (
    <li className={styles.problemCardWrapper}>
      <div className={styles.problemCardIcon}>
        {icon}
      </div>
      <div>
        <h3 className={styles.problemCardTitle}>{title}:</h3>
        <p className={styles.problemCardContent}>{children}</p>
      </div>
    </li>
  );
}
