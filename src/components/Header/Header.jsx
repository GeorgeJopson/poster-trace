import React from 'react';
import styles from "./Header.module.css";

export default function Header({children, type, className}){
  let output = [];
  for (const element of children) {
    if(typeof element === "string"){
      output.push(
        Array.from(element).map(
          (character,index)=><span className={styles.character} key={index}>{character}</span>)
      );
    }else{
      output.push(element);
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
