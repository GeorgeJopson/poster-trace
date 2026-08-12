import React from 'react';
import styled from "styled-components";

export default function Button({children, type}) {
  let BtnStyle;

  switch (type) {
    case "filled":
      BtnStyle = FilledButton;
      break;
    case "transparent":
      BtnStyle=TransparentButton;
      break;
    default:
      BtnStyle = FilledButton;
      break;
  }

  return (
    <ButtonWrapper>
      <BtnStyle>{children}</BtnStyle>
    </ButtonWrapper>
  );
}

const ButtonWrapper = styled.div`
  &:hover button {
    transform: scale(0.95);
  }
`

const Btn = styled.button`
  font-size: ${20/16}rem;
  font-family: var(--font-dm-sans),sans-serif;
  border-radius: 8px;
  
  border: none;
  padding: 4px 8px;
  transition: transform 0.1s ease-in-out;
  
  text-wrap: nowrap;
`
const FilledButton = styled(Btn)`
  background-color: var(--color-blue-950);
  color: white;
`
const TransparentButton = styled(Btn)`
  background-color: transparent;
  color:black;
`