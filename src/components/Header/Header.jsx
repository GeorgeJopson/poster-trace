import React from 'react';
import styles from "./Header.module.css";
import {crypto} from "next/dist/compiled/@edge-runtime/primitives";

function convertLineStringToElements(line) {
  const words = line.split(" ");

  let outputLine = []
  for (const word of words) {
    outputLine.push(
      <div className={styles.word} key={crypto.randomUUID()}>
        {Array.from(word).map(
          (character, index) => <span className={styles.character} key={index}>{character}</span>)
        }
      </div>
    )
    outputLine.push(<span key={crypto.randomUUID()}>&nbsp;</span>);
  }
  outputLine.pop();
  return <div className={styles.line} key={crypto.randomUUID()}>{outputLine}</div>;
}

export default function Header({children, type, className}){
  let output = [];
  if(typeof children === "string"){
    output.push(convertLineStringToElements(children));
  }else if (Array.isArray(children)){
    for (const line of children){
      if(typeof line === "string"){
        output.push(convertLineStringToElements(line))
      }
    }
  }else{
    throw new Error(`Unexpected type "${type}" for "${children}"`);
  }

  let Element;
  let wrapperClass;
  if(type === "title"){
    Element = "h1";
    wrapperClass = styles.title;
  }else if(type==="heading"){
    Element = "h2";
    wrapperClass = styles.heading;
  }

  const combinedClassName = [styles.base, wrapperClass, className].filter(Boolean).join(" ");

  return(
    <Element className={combinedClassName}>{output}</Element>
  );
}
