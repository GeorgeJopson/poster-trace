'use client';
import React from 'react';
import styles from "./ParticleButton.module.css";
import BaseButton from "../BaseButton";

const SHIMMER_DURATION_MS = 1000;
const SHIMMER_CLEANUP_MS = SHIMMER_DURATION_MS + 200;

export default function ParticleButton({children, className, fontSize, ...props}) {
  const [shimmerIds, setShimmerIds] = React.useState([]);

  React.useEffect(() => {
    if (shimmerIds.length === 0) return;

    const timeoutId = window.setTimeout(() => {
      setShimmerIds([]);
    }, SHIMMER_CLEANUP_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [shimmerIds]);

  function addShimmer() {
    setShimmerIds((ids) => [...ids, crypto.randomUUID()]);
  }

  return (
    <BaseButton className={`${styles.particleBtn} ${className}`} fontSize={fontSize} {...props} onMouseEnter={addShimmer}>
      {shimmerIds.map((id) => (
        <span key={id} className={styles.shimmer} />
      ))}
      {children}
    </BaseButton>
  );
}
