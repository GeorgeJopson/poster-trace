import React from 'react';
import Image from "next/image";
import {posterSize} from "@/app/_components/Hero/PosterWrapperConstants";
import {stockPoster5, stockPoster6, stockPoster7} from "../../../../public/imageDetails";
import {media} from "@/breakpoints";
import styles from "./PosterRow.module.css";

const imageScaleDefault = 0.8;
const imageScaleLaptop = 0.65;
const imageScaleTablet = 0.55;
const imageScale475 = 0.4;
const imageScale435 = 0.3;

const imageSizes = `
  (max-width: 27.1875rem) ${posterSize * imageScale435}px,
  (max-width: 29.6875rem) ${posterSize * imageScale475}px,
  ${media.tabletAndDown} ${posterSize * imageScaleTablet}px,
  ${media.laptopAndDown} ${posterSize * imageScaleLaptop}px,
  ${posterSize * imageScaleDefault}px
`;


export default function PosterRow() {
  return (
    <div className={styles.wrapper}>
      <div className={`${styles.posterWrapper} ${styles.poster1}`}>
        <Image
          src={stockPoster5.src}
          alt={stockPoster5.alt}
          fill
          sizes={imageSizes}
        />
      </div>
      <div className={`${styles.posterWrapper} ${styles.poster2}`}>
        <Image
          src={stockPoster6.src}
          alt={stockPoster6.alt}
          fill
          sizes={imageSizes}
        />
      </div>
      <div className={`${styles.posterWrapper} ${styles.poster3}`}>
        <Image
          src={stockPoster7.src}
          alt={stockPoster7.alt}
          fill
          sizes={imageSizes}
        />
      </div>
    </div>

  );
}
