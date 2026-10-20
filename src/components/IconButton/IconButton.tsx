import React from "react";
import Image from "next/image";
import styles from "./IconButton.module.css";

type IconButtonProps = React.ComponentProps<"button"> & {
  // Describes the action, as the icon itself is decorative.
  label: string;
  iconSrc: string;
  iconSize?: number;
};

// A round, borderless button showing a single icon, with a green tint on
// hover. Props are spread onto the button, so it can be a Radix trigger.
export default function IconButton({
  label,
  iconSrc,
  iconSize = 24,
  className,
  ...props
}: IconButtonProps) {
  return (
    <button
      className={`${styles.iconButton} ${className ?? ""}`}
      aria-label={label}
      {...props}
    >
      <Image width={iconSize} height={iconSize} src={iconSrc} alt="" />
    </button>
  );
}
