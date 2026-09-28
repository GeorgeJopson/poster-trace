import BaseButton from "./BaseButton";
import ParticleButton from "./effects/ParticleButton";
import ShrinkOnHoverWrapper from "./effects/ShrinkOnHoverWrapper";
import styles from "./Button.module.css";
import React from "react";

const VARIANTS = {
  filled: { className: styles.filled, particles: true, shrink: true },
  filledWithOutline: {
    className: styles.filledWithOutline,
    particles: true,
    shrink: false,
  },
  outline: { className: styles.outline, particles: false, shrink: true },
  transparent: {
    className: styles.transparent,
    particles: false,
    shrink: true,
  },
} as const;

export type ButtonVariant =
  | "filled"
  | "filledWithOutline"
  | "outline"
  | "transparent";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: React.ReactNode;
  variant: ButtonVariant;
  fontSize: string;
  href?: string;
  textWrap?: React.CSSProperties["textWrap"];
};

export default function Button({
  children,
  variant,
  fontSize,
  href,
  textWrap = "nowrap",
  ...props
}: ButtonProps) {
  const { className, particles, shrink } = VARIANTS[variant];

  const ButtonImplementation = particles ? ParticleButton : BaseButton;

  const button = (
    <ButtonImplementation
      className={className}
      fontSize={fontSize}
      href={href}
      textWrap={textWrap}
      {...props}
    >
      {children}
    </ButtonImplementation>
  );

  return shrink ? (
    <ShrinkOnHoverWrapper>{button}</ShrinkOnHoverWrapper>
  ) : (
    button
  );
}
