"use client";

import type { ButtonHTMLAttributes, MouseEvent } from "react";
import { animated } from "@react-spring/web";

import DashedCard from "@/components/DashedCard";
import useBoop from "@/utils/useBoop";

import styles from "./NewItemButton.module.css";

type NewItemButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> & {
  label: string;
};

export default function NewItemButton({
  label,
  className,
  onMouseEnter,
  ...props
}: NewItemButtonProps) {
  const [style, trigger] = useBoop({ rotation: 10 });

  return (
    <DashedCard
      as="button"
      type="button"
      className={className ? `${styles.button} ${className}` : styles.button}
      onMouseEnter={(event: MouseEvent<HTMLButtonElement>) => {
        trigger();
        onMouseEnter?.(event);
      }}
      {...props}
    >
      <span className={styles.text}>{label}</span>
      <animated.span style={style} className={styles.plus}>
        +
      </animated.span>
    </DashedCard>
  );
}
