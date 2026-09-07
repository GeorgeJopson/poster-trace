import React from 'react';
import Image from "next/image";
import {posterSize} from "@/app/_components/Hero/PosterWrapperConstants";
import {stockPoster1, stockPoster2, stockPoster3} from "../../../../public/imageDetails";
import styles from "./PosterFan.module.css";

const imageSmallerScale = 0.8;
const imageSizes = `(max-width: 81.25rem) ${posterSize*imageSmallerScale}px, ${posterSize}px`;

export default function PosterFan() {
  return (
    <div className={styles.wrapper}>
      <div className={`${styles.posterWrapper} ${styles.largeScreens} ${styles.posterThree}`}>
        <Image
          src={stockPoster3.src}
          alt={stockPoster3.alt}
          fill
          sizes={imageSizes}
        />
      </div>

      <div className={`${styles.posterWrapper} ${styles.largeScreens} ${styles.posterTwo}`}>
        <Image
          src={stockPoster2.src}
          alt={stockPoster2.alt}
          fill
          sizes={imageSizes}
        />
      </div>

      <div className={`${styles.posterWrapper} ${styles.posterOne}`}>
        <Image
          src={stockPoster1.src}
          alt={stockPoster1.alt}
          fill
          sizes={imageSizes}
        />
      </div>
    </div>
  );
}
