import React from "react";
import styles from "./ContentGroup.module.css";

type PolymorphicProps<E extends React.ElementType> = React.PropsWithChildren<
  React.ComponentPropsWithoutRef<E> & {
    as?: E;
  }
>;

type ContentGroupProps<T extends React.ElementType> = PolymorphicProps<T> & {
  children: React.ReactNode;
  className?: string;
};

export default function ContentGroup<T extends React.ElementType="div">({children, className, as, ...rest}:ContentGroupProps<T>) {
    const Element = as ?? "div";
    return (
    <Element
      className={className ? `${styles.contentGroup} ${className}` : styles.contentGroup}
      {...rest}
    >
      {children}
    </Element>
  );
}
