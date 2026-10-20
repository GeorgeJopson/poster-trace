import React from "react";
import styles from "./BlurredGlass.module.css";

type BlurredGlassProps = {
  children: React.ReactNode;
  className?: string;
};

// A container with a translucent, blurred background, clipped to its bounds.
function BlurredGlass({ children, className }: BlurredGlassProps) {
  return (
    <div className={`${styles.wrapper} ${className ?? ""}`}>
      <div className={styles.glass} />
      {children}
    </div>
  );
}

export default BlurredGlass;
