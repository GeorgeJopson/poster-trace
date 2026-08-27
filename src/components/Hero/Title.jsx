import React from 'react';
import styled from "styled-components";
import {QUERIES} from "@/constants";

export default function Title({children}){
  let output = [];
  for (const element of children) {
    if(typeof element === "string"){
      output.push(
        Array.from(element).map(
          (character,index)=><TitleCharacter key={index}>{character}</TitleCharacter>)
      );
    }else{
      output.push(element);
    }
  }

  return(
    <TitleWrapper>{output}</TitleWrapper>
  );
}

const TitleCharacter = styled.span`
  display: inline-block;
  transition: scale 0.1s;
  &:hover{
    scale: 1.2;
  }
`

const TitleWrapper = styled.h1`
  font-size: ${76/16}rem;
  line-height: 1.1;
  font-weight: 500;
  font-family: var(--font-bungee), sans-serif;
  text-align: left;
  
  color: var(--color-green-800);
  
  @media ${QUERIES.laptopAndDown}{
   font-size: ${60/16}rem; 
  }
  @media ${QUERIES.tabletAndDown} {
    font-size: ${48/16}rem;
  }
  @media ${QUERIES.phoneAndDown} {
    font-size: ${32/16}rem;
  }
  
  @media ${QUERIES.smallPhoneAndDown} {
    font-size: ${26/16}rem;
    
  }
`