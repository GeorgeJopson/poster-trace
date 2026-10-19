import styles from "./PublicNavBarSpacer.module.css";

// Reserves the space the fixed PublicNavBar covers. Public pages render this
// first so their content starts below the nav. It's transparent, so the
// parent's background shows behind the nav.
export default function PublicNavBarSpacer() {
  return <div className={styles.spacer} aria-hidden />;
}
