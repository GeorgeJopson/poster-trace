import React from 'react';
import Image from "next/image";
import { stockPosters } from "@/imageDetails";
import { posterSize } from "@/components/PosterRow";
import { media } from "@/breakpoints";
import styles from "./PosterFan.module.css";

const imageSmallerScale = 0.8;
const imageSizes = `${media.laptopAndDown} ${posterSize * imageSmallerScale}px, ${posterSize}px`;

// Ordered back-to-front so later posters stack on top; the outer two are hidden
// on small screens.
const fanPosters = [
  { poster: stockPosters[2], className: `${styles.largeScreens} ${styles.posterThree}` },
  { poster: stockPosters[1], className: `${styles.largeScreens} ${styles.posterTwo}` },
  { poster: stockPosters[0], className: styles.posterOne },
];

export default function PosterFan() {
  return (
    <div className={styles.wrapper}>
      {fanPosters.map(({ poster, className }) => (
        <div key={poster.src} className={`${styles.posterWrapper} ${className}`}>
          <Image
            loading="eager"
            src={poster.src}
            alt={poster.alt}
            fill
            sizes={imageSizes}
          />
        </div>
      ))}
    </div>
  );
}
