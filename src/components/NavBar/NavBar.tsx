import React from "react";
import Logo from "@/components/Logo";
import Button, { ButtonVariant } from "@/components/Button";
import CentralColumn from "@/components/CentralColumn";
import styles from "./NavBar.module.css";

export type NavBarTarget = {
  targetUrl: string;
  name: string;
  buttonStyle: ButtonVariant;
};

export type NavBarProps = {
  logoTarget: string;
  targets: NavBarTarget[];
};

export default function NavBar({ logoTarget, targets }: NavBarProps) {
  return (
    <nav className={styles.navBarWrapper} aria-label="Primary">
      <CentralColumn>
        <div className={styles.contentWrapper}>
          <Logo href={logoTarget} />
          <div className={styles.buttonGroup}>
            {targets.map(({ targetUrl, name, buttonStyle }) => (
              <Button
                key={targetUrl}
                variant={buttonStyle}
                href={targetUrl}
                fontSize={`${20 / 16}rem`}
              >
                {name}
              </Button>
            ))}
          </div>
        </div>
      </CentralColumn>
    </nav>
  );
}
