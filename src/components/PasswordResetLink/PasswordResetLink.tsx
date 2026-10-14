import Link from "next/link";

import { routeNames } from "@/routeNames";

import styles from "./PasswordResetLink.module.css";

type PasswordResetLinkProps = {
  className?: string;
};

export default function PasswordResetLink({
  className,
}: PasswordResetLinkProps) {
  return (
    <Link
      className={className ? `${styles.link} ${className}` : styles.link}
      href={routeNames.passwordReset}
    >
      Reset my password
    </Link>
  );
}
