import React from "react";
import Image from "next/image";
import { stockPosters } from "@/imageDetails";
import { posterSize } from "@/components/PosterRow";
import { media } from "@/breakpoints";
import preloadResponsiveImage from "@/utils/preloadResponsiveImage";
import styles from "./PosterFan.module.css";

const imageSmallerScale = 0.8;
const imageSizes = `${media.laptopAndDown} ${
  posterSize * imageSmallerScale
}px, ${posterSize}px`;

// Mirror the CSS that hides the fan (Hero.module.css) and its outer posters
// (PosterFan.module.css), so each poster is only preloaded where it shows.
const fanVisible = "not all and (max-width: calc(760 / 16 * 1rem))";
const outerPostersVisible = `not all and ${media.tabletAndDown}`;

// Ordered back-to-front so later posters stack on top; the outer two are hidden
// on small screens.
const fanPosters = [
  {
    poster: stockPosters[2],
    className: `${styles.largeScreens} ${styles.posterThree}`,
    preloadMedia: outerPostersVisible,
    isLargestPoster: false,
  },
  {
    poster: stockPosters[1],
    className: `${styles.largeScreens} ${styles.posterTwo}`,
    preloadMedia: outerPostersVisible,
    isLargestPoster: false,
  },
  {
    poster: stockPosters[0],
    className: styles.posterOne,
    preloadMedia: fanVisible,
    isLargestPoster: true,
  },
];

export default function PosterFan() {
  return (
    <div className={styles.wrapper}>
      {fanPosters.map(
        ({ poster, className, preloadMedia, isLargestPoster }) => {
          const imageProps = {
            src: poster.src,
            alt: poster.alt,
            fill: true,
            sizes: imageSizes,
          };

          // The images themselves stay lazy, because browsers still download
          // eager images that are hidden with `display: none`.
          preloadResponsiveImage(imageProps, {
            media: preloadMedia,
            fetchPriority: isLargestPoster ? "high" : undefined,
          });

          return (
            <div
              key={poster.src}
              className={`${styles.posterWrapper} ${className}`}
            >
              <Image {...imageProps} alt={poster.alt} />
            </div>
          );
        },
      )}
    </div>
  );
}
