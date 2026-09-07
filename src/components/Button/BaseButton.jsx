import Link from "next/link";
import styles from "./BaseButton.module.css";

export default function BaseButton({children, className, fontSize, href, ...props}) {
  const Component = href != null ? Link : "button";
  return (
      <Component className={`${styles.btn} ${className}`} style={{fontSize}} href={href} {...props}>{children}</Component>
  );
}
