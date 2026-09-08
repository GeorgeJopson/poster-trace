import BaseButton from "./BaseButton";
import ParticleButton from "./effects/ParticleButton";
import ShrinkOnHoverWrapper from "./effects/ShrinkOnHoverWrapper";
import styles from "./Button.module.css";
import React from "react";

const VARIANTS = {
  filled:            {className: styles.filled,            particles: true,  shrink: true},
  filledWithOutline: {className: styles.filledWithOutline, particles: true,  shrink: false},
  outline:           {className: styles.outline,           particles: false, shrink: true},
  transparent:       {className: styles.transparent,       particles: false, shrink: true},
} as const;

const FALLBACK = {className: styles.filled, particles: false, shrink: true};

export default function Button({children, variant, fontSize, ...props}:{children?: React.ReactNode, variant:"filled" | "filledWithOutline" |"outline" | "transparent", fontSize:number}) {
  const {className, particles, shrink} = VARIANTS[variant] ?? FALLBACK;

  const ButtonImplementation = particles ? ParticleButton : BaseButton;

  const button = (
    <ButtonImplementation className={className} fontSize={fontSize} {...props}>
      {children}
    </ButtonImplementation>
  );

  return shrink ? <ShrinkOnHoverWrapper>{button}</ShrinkOnHoverWrapper> : button;
}
