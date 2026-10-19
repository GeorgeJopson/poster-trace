import React from "react";
import ContentGroup from "@/components/ContentGroup";
import CentralColumn from "@/components/CentralColumn";
import PosterFan from "@/app/_components/Hero/PosterFan";
import HeaderContent from "@/app/_components/Hero/HeaderContent";
import { PublicNavBarSpacer } from "@/components/PublicNavigation";
import PosterRow from "@/components/PosterRow";
import { stockPosters } from "@/imageDetails";
import styles from "./Hero.module.css";

function Hero() {
  return (
    <ContentGroup as="section" aria-label="Overview" className={styles.wrapper}>
      {/* Inside the yellow section, so the yellow runs up behind the nav */}
      <PublicNavBarSpacer />
      <CentralColumn>
        <div className={styles.contentWrapper}>
          <header className={styles.headerSection}>
            <div className={styles.posterFanWrapper}>
              <PosterFan />
            </div>
            <HeaderContent />
          </header>

          <div className={styles.posterRowSection}>
            <PosterRow
              variant="compact"
              eager
              posters={stockPosters.slice(1, 4)}
            />
          </div>
        </div>
      </CentralColumn>
    </ContentGroup>
  );
}

export default Hero;
