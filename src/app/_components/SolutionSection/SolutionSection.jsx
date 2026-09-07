import Header from "@/components/Header";
import CentralColumn from "@/components/CentralColumn";
import React from "react";
import List from "@/app/_components/SolutionSection/List";
import PosterRow from "@/components/PosterRow";
import { stockPosters } from "@/imageDetails";
import styles from "./SolutionSection.module.css";

export default function SolutionSection() {
  return (
    <section className={styles.solutionSection} aria-label="The solution">
      <CentralColumn>
        <div className={styles.columnLayoutWrapper}>

          <div className={`${styles.column} ${styles.imageColumn}`}>
            <PosterRow variant="showcase" posters={stockPosters.slice(4, 7)}/>
          </div>
          <div className={`${styles.column} ${styles.textColumn}`}>
            <Header variant="heading" className={styles.solutionHeader}>The Solution</Header>
            <List>
              <>Create a campaign, give us a link for what you’re trying to advertise, and position the created QR code
                on your poster page!
              </>
              <>Print of as many posters as you want, and register them by scanning their QR codes as you put them
                up.
              </>
              <>Sit back, relax, and watch the analytics roll in. Whenever one of your posters is scanned, you get a log
                telling you when and where.
              </>
            </List>
          </div>
        </div>
      </CentralColumn>
    </section>
  );
}
