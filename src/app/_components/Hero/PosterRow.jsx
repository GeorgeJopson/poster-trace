import React from 'react';
import Image from "next/image";
import {posterSize} from "@/app/_components/Hero/PosterWrapperConstants";
import {stockPoster2, stockPoster3, stockPoster4} from "../../../../public/imageDetails";
import {media} from "@/breakpoints";
import styles from "./PosterRow.module.css";

const imageLargeScale = 0.45;
const imageMediumScale = 0.4;
const imageSmallScale = 0.35;

const imageSizes = `
  ${media.smallPhoneAndDown} ${posterSize*imageSmallScale}px,
  ${media.phoneAndDown} ${posterSize*imageMediumScale}px,
  ${posterSize*imageLargeScale}px
 `;


export default function PosterRow() {
  return (
    <div className={styles.wrapper}>
      <div className={`${styles.posterWrapper} ${styles.poster1}`}>
        <Image
          src={stockPoster2.src}
          alt={stockPoster2.alt}
          fill
          sizes={imageSizes}
        />
      </div>
      <div className={`${styles.posterWrapper} ${styles.poster2}`}>
        <Image
          src={stockPoster3.src}
          alt={stockPoster3.alt}
          fill
          sizes={imageSizes}
        />
      </div>
      <div className={`${styles.posterWrapper} ${styles.poster3}`}>
        <Image
          src={stockPoster4.src}
          alt={stockPoster4.alt}
          fill
          sizes={imageSizes}
        />
      </div>
    </div>

  );
}
