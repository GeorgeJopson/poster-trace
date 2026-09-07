import React from 'react';
import ContentGroup from "@/components/ContentGroup";
import CentralColumn from "@/components/CentralColumn";
import styles from "./CallToAction.module.css";
import Button from "@/components/Button";

export default function CallToAction() {
  return (
    <ContentGroup as="section" aria-label="Get started">
      <CentralColumn>
        <div className={styles.callToActionWrapper}>
          <div className={styles.box}>
            <h2 className={styles.boxHeader}>
              Take the guess work out of your posters.
            </h2>
            <div className={styles.btnWrapper}>
              <Button variant={"filledWithOutline"} href={"/"} fontSize={"var(--btn-font-size)"}>Sign Up Now</Button>
            </div>
          </div>
        </div>
      </CentralColumn>
    </ContentGroup>
  );
}
