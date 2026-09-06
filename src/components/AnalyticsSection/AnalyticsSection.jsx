import React from 'react';
import ContentGroup from "@/components/ContentGroup";
import CentralColumn from "@/components/CentralColumn";
import {areaChartImage, lineChartImage, mapChartImage} from "../../../public/imageDetails";
import Image from "next/image";
import Header from "@/components/Header";
import styles from "./AnalyticsSection.module.css";


function AnalyticsSection() {
  return (
    <ContentGroup>
      <CentralColumn>
        <div className={styles.analyticsWrapper}>
          <Header type={"heading"}>The&nbsp;Analytics</Header>
          <div className={styles.cardRow}>
            <div className={styles.card} style={{minWidth: `${231 + 12 * 2}px`}}>
              <p className={styles.cardText}>Get real-time click through results, so you can see how interest is moving over time.</p>
              <div className={styles.imageCard}>
                <Image src={lineChartImage.src} alt={lineChartImage.alt} width={231} height={192}/>
              </div>
            </div>
            <div className={styles.card} style={{minWidth: `${260 + 12 * 2}px`}}>
              <p className={styles.cardText}>Gather A/B poster test results, so you can understand how different designs are performing with your audience.</p>
              <div className={styles.imageCard}>
                <Image src={areaChartImage.src} alt={areaChartImage.alt} width={328} height={192}/>
              </div>
            </div>
            <div className={styles.card} style={{minWidth: `${260 + 12 * 2}px`}}>
              <p className={styles.cardText}>Find out which areas are hotspots where your posters perform the best.</p>
              <div className={styles.imageCard}>
                <Image src={mapChartImage.src} alt={mapChartImage.alt} width={270} height={192}/>
              </div>
            </div>
          </div>
        </div>
      </CentralColumn>
    </ContentGroup>
  );
}

export default AnalyticsSection;
