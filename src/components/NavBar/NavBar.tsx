import React from "react";
import Logo from "@/components/Logo";
import Button from "@/components/Button";
import CentralColumn from "@/components/CentralColumn";
import styles from "./NavBar.module.css";
import { routeNames } from "@/routeNames";

export default function NavBar() {
  return (
    <nav className={styles.navBarWrapper} aria-label="Primary">
      <CentralColumn>
        <div className={styles.contentWrapper}>
          <Logo />
          <div className={styles.buttonGroup}>
            <Button
              variant={"transparent"}
              href={routeNames.signIn}
              fontSize={`${20 / 16}rem`}
            >
              Log In
            </Button>
            <Button
              variant={"filled"}
              href={routeNames.signUp}
              fontSize={`${20 / 16}rem`}
            >
              Sign Up
            </Button>
          </div>
        </div>
      </CentralColumn>
    </nav>
  );
}
