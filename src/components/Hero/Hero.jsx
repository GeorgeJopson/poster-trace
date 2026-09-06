import React from 'react';
import ContentGroup from "@/components/ContentGroup";
import CentralColumn from "@/components/CentralColumn";
import PosterFan from "@/components/Hero/PosterFan";
import HeaderContent from "@/components/Hero/HeaderContent";
import PosterRow from "@/components/Hero/PosterRow";
import styles from "./Hero.module.css";


function Hero() {
  return (
    <ContentGroup className={styles.wrapper}>
      <CentralColumn>
        <div className={styles.contentWrapper}>

          <header className={styles.headerSection}>
            <div className={styles.posterFanWrapper}>
              <PosterFan/>
            </div>
            <HeaderContent/>
          </header>

          <div className={styles.posterRowSection}>
            <PosterRow/>
          </div>

        </div>
      </CentralColumn>
    </ContentGroup>

  );
}

export default Hero;
