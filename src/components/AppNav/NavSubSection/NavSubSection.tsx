import React, { useId } from "react";

import NavLink from "../NavLink";
import styles from "./NavSubSection.module.css";

type NavSubSectionProps = {
  title: string;
  links: { name: string; href: string }[];
};

// Page-specific navigation shown in the navigation pane, e.g. a campaign's
// pages under the campaign's name.
export default function NavSubSection({ title, links }: NavSubSectionProps) {
  const titleId = useId();

  return (
    <section className={styles.subSection} aria-labelledby={titleId}>
      <h2 className={styles.title} id={titleId}>
        {title}
      </h2>
      <ul className={styles.linkList}>
        {links.map(({ name, href }) => (
          <li key={href}>
            <NavLink href={href}>{name}</NavLink>
          </li>
        ))}
      </ul>
    </section>
  );
}
