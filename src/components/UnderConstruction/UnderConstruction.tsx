import CentralColumn from "@/components/CentralColumn";
import Header from "@/components/Header";

import styles from "./UnderConstruction.module.css";

// Placeholder for pages that haven't been built yet.
export default function UnderConstruction() {
  return (
    <CentralColumn>
      <div className={styles.wrapper}>
        <Header variant="heading">Under Construction</Header>
        <p className={styles.text}>
          This page isn&apos;t ready yet. Check back soon!
        </p>
      </div>
    </CentralColumn>
  );
}
