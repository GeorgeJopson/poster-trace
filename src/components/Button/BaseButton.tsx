import Link from "next/link";
import styles from "./BaseButton.module.css";
import React from "react";

type BaseButtonProps = React.HTMLAttributes<HTMLElement> & {
  fontSize?: string;
  href?: string;
  textWrap?: React.CSSProperties["textWrap"];
};

export default function BaseButton({
  children,
  className,
  fontSize,
  href,
  textWrap,
  ...props
}: BaseButtonProps) {
  if (href != null) {
    return (
      <Link
        className={`${styles.btn} ${className}`}
        style={{ fontSize, textWrap }}
        href={href}
        {...props}
      >
        {children}
      </Link>
    );
  }
  return (
    <button
      className={`${styles.btn} ${className}`}
      style={{ fontSize, textWrap }}
      {...props}
    >
      {children}
    </button>
  );
}
