import React from 'react';
import styles from "./Header.module.css";

function convertLineStringToElements(line) {
  const words = line.split(" ");

  let outputLine = []
  words.forEach((word, wordIndex) => {
    outputLine.push(
      <div className={styles.word} key={wordIndex}>
        {Array.from(word).map(
          (character, index) => <span className={styles.character} key={`${wordIndex} ${index}`}>{character}</span>)
        }
      </div>
    )
    outputLine.push(<span key={`${wordIndex} space`}>&nbsp;</span>);
  })

  outputLine.pop();
  return <div className={styles.line} key={line}>{outputLine}</div>;
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
