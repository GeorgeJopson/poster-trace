"use client";

import type { ButtonHTMLAttributes, FocusEvent, MouseEvent } from "react";
import { animated } from "@react-spring/web";

import DashedCard from "@/components/DashedCard";
import useHoverRotation from "@/utils/useHoverRotation";

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
  onMouseLeave,
  onFocus,
  onBlur,
  ...props
}: NewItemButtonProps) {
  const [style, hoverHandlers] = useHoverRotation({ rotation: 10 });

  return (
    <DashedCard
      as="button"
      type="button"
      className={className ? `${styles.button} ${className}` : styles.button}
      onMouseEnter={(event: MouseEvent<HTMLButtonElement>) => {
        hoverHandlers.onMouseEnter();
        onMouseEnter?.(event);
      }}
      onMouseLeave={(event: MouseEvent<HTMLButtonElement>) => {
        hoverHandlers.onMouseLeave();
        onMouseLeave?.(event);
      }}
      onFocus={(event: FocusEvent<HTMLButtonElement>) => {
        hoverHandlers.onFocus();
        onFocus?.(event);
      }}
      onBlur={(event: FocusEvent<HTMLButtonElement>) => {
        hoverHandlers.onBlur();
        onBlur?.(event);
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
