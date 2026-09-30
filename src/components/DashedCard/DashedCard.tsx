import type { ComponentPropsWithRef, ElementType } from "react";

import styles from "./DashedCard.module.css";

type DashedCardProps<T extends ElementType> = { as?: T } & Omit<
  ComponentPropsWithRef<T>,
  "as"
>;

export default function DashedCard<T extends ElementType = "div">({
  as,
  className,
  ...props
}: DashedCardProps<T>) {
  const Component: ElementType = as ?? "div";
  return (
    <Component
      className={className ? `${styles.card} ${className}` : styles.card}
      {...props}
    />
  );
}
