"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import styles from "./NavLink.module.css";

type NavLinkProps = {
  href: string;
  children: React.ReactNode;
};

// A navigation link that marks itself as the current page. Exact match only,
// so "Campaigns" isn't active on a campaign's own pages.
export default function NavLink({ href, children }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      className={`${styles.navLink} ${isActive ? styles.active : ""}`}
      href={href}
      aria-current={isActive ? "page" : undefined}
    >
      {children}
    </Link>
  );
}
