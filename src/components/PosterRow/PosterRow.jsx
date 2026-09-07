import React from "react";
import Image from "next/image";
import { media } from "@/breakpoints";
import styles from "./PosterRow.module.css";

/** Intrinsic width (px) of a poster; its height follows the ISO-216 ratio. */
export const posterSize = 256;

const rotationClasses = [styles.poster1, styles.poster2, styles.poster3];

const sizesByVariant = {
  compact: `
    ${media.smallPhoneAndDown} ${posterSize * 0.35}px,
    ${media.phoneAndDown} ${posterSize * 0.4}px,
    ${posterSize * 0.45}px
  `,
  showcase: `
    (max-width: calc(435 / 16 * 1rem)) ${posterSize * 0.3}px,
    (max-width: calc(475 / 16 * 1rem)) ${posterSize * 0.4}px,
    ${media.tabletAndDown} ${posterSize * 0.55}px,
    ${media.laptopAndDown} ${posterSize * 0.65}px,
    ${posterSize * 0.8}px
  `,
};

/**
 * A row of slightly-rotated poster images.
 *
 * @param posters  array of `{ src, alt }` (a slice of `stockPosters`), rendered in order
 * @param variant  `"compact"` (default) or `"showcase"` — sets image sizing and wrapping
 * @param eager    load the images immediately instead of lazily; set when the row is above the fold
 */
export default function PosterRow({ posters, variant = "compact", eager = false }) {
  return (
    <div className={`${styles.wrapper} ${styles[variant]}`}>
      {posters.map((poster, index) => (
        <div
          key={poster.src}
          className={`${styles.posterWrapper} ${rotationClasses[index % rotationClasses.length]}`}
        >
          <Image
            src={poster.src}
            alt={poster.alt}
            fill
            sizes={sizesByVariant[variant]}
            loading={eager ? "eager" : undefined}
          />
        </div>
      ))}
    </div>
  );
}
