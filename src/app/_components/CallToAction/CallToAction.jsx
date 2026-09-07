import React from 'react';
import ContentGroup from "@/components/ContentGroup";
import CentralColumn from "@/components/CentralColumn";
import styles from "./CallToAction.module.css";
import Button from "@/components/Button";

export default function CallToAction() {
  return (
    <ContentGroup>
      <CentralColumn>
        <div className={styles.callToActionWrapper}>
          <div className={styles.box}>
            <div className={styles.boxHeader}>
              Take the guess work out of your posters.
            </div>
            <div className={styles.btnWrapper}>
              <Button type={"filledWithOutline"} fontSize={"var(--btn-font-size)"}>Sign Up Now</Button>
            </div>
          </div>
        </div>
      </CentralColumn>
    </ContentGroup>
  );
}
