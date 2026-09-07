import React from 'react';
import styles from "./Header.module.css";

export default function Header({children, type, className}){
  let output = [];
  for (const line of children){
    if(typeof line === "string"){
      const words = line.split(" ");
      for (const word of words){
        output.push(
          <div className={styles.word} key={word}>
            {Array.from(word).map(
              (character,index)=><span className={styles.character} key={index}>{character}</span>)
              }
          </div>
        )
        output.push(<span key={crypto.randomUUID()}>&nbsp;</span>);
      }
      output.pop();
    }else{
      output.push(line);
    }
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
