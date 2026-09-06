import React from 'react';
import ContentGroup from "@/components/ContentGroup";
import CentralColumn from "@/components/CentralColumn";
import SignUpNowBtn from "@/components/CallToAction/SignUpNowBtn";
import styles from "./CallToAction.module.css";

export default function CallToAction() {
  return (
    <ContentGroup>
      <CentralColumn>
        <div className={styles.callToActionWrapper}>
          <div className={styles.box}>
            <div className={styles.boxHeader}>
              Take the guess work out of your posters.
            </div>
            <SignUpNowBtn>Sign Up Now</SignUpNowBtn>
          </div>
        </div>
      </CentralColumn>
    </ContentGroup>
  );
}
