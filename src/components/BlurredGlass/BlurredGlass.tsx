import React from "react";
import styles from "./BlurredGlass.module.css";

type BlurredGlassProps = {
  children: React.ReactNode;
  className?: string;
  // Opacity of the white background, from 0 to 1.
  backgroundOpacity?: number;
};

// A container with a translucent, blurred background, clipped to its bounds.
function BlurredGlass({
  children,
  className,
  backgroundOpacity = 0.7,
}: BlurredGlassProps) {
  return (
    <div className={`${styles.wrapper} ${className ?? ""}`}>
      <div
        className={styles.glass}
        style={
          {
            "--glass-opacity": `${backgroundOpacity * 100}%`,
          } as React.CSSProperties
        }
      />
      {children}
    </div>
  );
}

export default BlurredGlass;
