'use client';
import React from 'react';
import styles from "./SignUpNowBtn.module.css";

function useShimmerCleanUp(shimmer, setShimmer) {
  React.useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setShimmer([]);
    }, 1000+200);

    return () => {
      window.clearTimeout(timeoutId);
    }
  }, [shimmer, setShimmer]);

}

export default function SignUpNowBtn() {
  const [shimmers, setShimmers] = React.useState([]);
  useShimmerCleanUp(shimmers, setShimmers);
  function addShimmer() {
    setShimmers([...shimmers,<span key={crypto.randomUUID()} className={styles.shimmer}/>]);
  }

  return (
    <button className={styles.btn} onMouseEnter={()=>addShimmer()}>
      {shimmers}
      Sign Up Now
    </button>
  )
}
