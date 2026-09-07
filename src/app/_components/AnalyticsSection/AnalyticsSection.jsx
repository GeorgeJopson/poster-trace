import React from 'react';
import ContentGroup from "@/components/ContentGroup";
import CentralColumn from "@/components/CentralColumn";
import { chartImages } from "@/imageDetails";
import Image from "next/image";
import Header from "@/components/Header";
import styles from "./AnalyticsSection.module.css";


function AnalyticsSection() {
  return (
    <ContentGroup as="section" aria-label="The analytics">
      <CentralColumn>
        <div className={styles.analyticsWrapper}>
          <Header variant="heading">The Analytics</Header>
          <ul className={styles.cardRow}>
            <li className={styles.card} style={{minWidth: `${231 + 12 * 2}px`}}>
              <p className={styles.cardText}>Get real-time click through results, so you can see how interest is moving over time.</p>
              <div className={styles.imageCard}>
                <Image src={chartImages.line.src} alt={chartImages.line.alt} width={231} height={192}/>
              </div>
            </li>
            <li className={styles.card} style={{minWidth: `${260 + 12 * 2}px`}}>
              <p className={styles.cardText}>Gather A/B poster test results, so you can understand how different designs are performing with your audience.</p>
              <div className={styles.imageCard}>
                <Image src={chartImages.area.src} alt={chartImages.area.alt} width={260} height={192}/>
              </div>
            </li>
            <li className={styles.card} style={{minWidth: `${260 + 12 * 2}px`}}>
              <p className={styles.cardText}>Find out which areas are hotspots where your posters perform the best.</p>
              <div className={styles.imageCard}>
                <Image src={chartImages.map.src} alt={chartImages.map.alt} width={260} height={192}/>
              </div>
            </li>
          </ul>
        </div>
      </CentralColumn>
    </ContentGroup>
  );
}

export default AnalyticsSection;
