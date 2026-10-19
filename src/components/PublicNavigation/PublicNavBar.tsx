import Logo from "@/components/Logo";
import Button, { ButtonVariant } from "@/components/Button";
import CentralColumn from "@/components/CentralColumn";
import { routeNames } from "@/routeNames";
import styles from "./PublicNavBar.module.css";

type PublicNavBarTarget = {
  targetUrl: string;
  name: string;
  buttonStyle: ButtonVariant;
};

const targets: PublicNavBarTarget[] = [
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

export default function PublicNavBar() {
  return (
    <nav className={styles.navBar} aria-label="Primary">
      <CentralColumn>
        <div className={styles.content}>
          <div className={styles.background} />
          <Logo />
          <div className={styles.buttonGroup}>
            {targets.map(({ targetUrl, name, buttonStyle }) => (
              <Button
                key={targetUrl}
                variant={buttonStyle}
                href={targetUrl}
                fontSize="1rem"
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
