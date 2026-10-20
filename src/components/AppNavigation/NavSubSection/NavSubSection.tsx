import React, { useId } from "react";

import NavLink from "../_components/NavLink";
import styles from "./NavSubSection.module.css";

type NavSubSectionProps = {
  title: string;
  links: { name: string; href: string }[];
  // Extra items after the links, e.g. a button that isn't a link.
  children?: React.ReactNode;
};

// A group of links in the navigation pane, under a title, e.g. a
// campaign's pages under the campaign's name.
export default function NavSubSection({
  title,
  links,
  children,
}: NavSubSectionProps) {
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
        {React.Children.map(children, (child) => (
          <li>{child}</li>
        ))}
      </ul>
    </section>
  );
}
