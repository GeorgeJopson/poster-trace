import React from "react";
import Link from "next/link";

import { routeNames } from "@/routeNames";

import styles from "./PasswordResetLink.module.css";

type PasswordResetLinkProps = {
  className?: string;
  children?: React.ReactNode;
};

export default function PasswordResetLink({
  className,
  children = "Reset my password",
}: PasswordResetLinkProps) {
  return (
    <Link
      className={className ? `${styles.link} ${className}` : styles.link}
      href={routeNames.passwordReset}
    >
      {children}
    </Link>
  );
}
