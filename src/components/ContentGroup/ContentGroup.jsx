import React from "react";
import styles from "./ContentGroup.module.css";

export default function ContentGroup({children, className, as: Element = "div", ...rest}) {
  return (
    <Element
      className={className ? `${styles.contentGroup} ${className}` : styles.contentGroup}
      {...rest}
    >
      {children}
    </Element>
  );
}
