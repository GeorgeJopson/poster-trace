import React from "react";
import Logo from "@/components/Logo";
import Button, { ButtonVariant } from "@/components/Button";
import CentralColumn from "@/components/CentralColumn";
import { routeNames } from "@/routeNames";
import styles from "./NavBar.module.css";

type NavBarTarget = {
  targetUrl: string;
  name: string;
  buttonStyle: ButtonVariant;
};

const targets: NavBarTarget[] = [
  {
    targetUrl: routeNames.signIn,
    name: "Log In",
    buttonStyle: "transparent",
  },
  {
    targetUrl: routeNames.signUp,
    name: "Sign Up",
    buttonStyle: "filled",
  },
];

export default function NavBar() {
  return (
    <nav className={styles.navBarWrapper} aria-label="Primary">
      <CentralColumn>
        <div className={styles.contentWrapper}>
          <Logo href="/" />
          <div className={styles.buttonGroup}>
            {targets.map(({ targetUrl, name, buttonStyle }) => (
              <Button
                key={targetUrl + name}
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
