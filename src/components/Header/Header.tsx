import React from 'react';
import styles from "./Header.module.css";

const VARIANT_ELEMENTS = {
  title: "h1",
  heading: "h2",
} as const;

type HeaderLineProps = {
  text: string;
};

function HeaderLine({ text } : HeaderLineProps) : React.ReactElement {
  const words = text.split(" ");

  return (
    <span className={styles.line}>
      {words.map((word, wordIndex) => (
        <span className={styles.word} key={wordIndex}>
          {Array.from(word).map((character, characterIndex) => (
            <span className={styles.character} key={characterIndex}>{character}</span>
          ))}
          {wordIndex < words.length - 1 ? " " : null}
        </span>
      ))}
    </span>
  );
}

type HeaderProps = {
  children: string;
  variant: "title" | "heading";
  className?: string;
};

export default function Header({ children, variant = "heading", className } : HeaderProps) {
  const Element = VARIANT_ELEMENTS[variant];
  const combinedClassName = [styles.base, styles[variant], className].filter(Boolean).join(" ");

  return (
    <Element className={combinedClassName}>
      {children.split("\n").map((line, lineIndex) => (
        <HeaderLine text={line} key={lineIndex} />
      ))}
    </Element>
  );
}
