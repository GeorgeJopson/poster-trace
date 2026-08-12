import React from 'react';
import styled from "styled-components";

export default function Button({children, type, fontSize}) {
  let BtnStyle;

  switch (type) {
    case "filled":
      BtnStyle = FilledButton;
      break;
    case "transparent":
      BtnStyle=TransparentButton;
      break;
    case "outline":
      BtnStyle = OutlineButton;
      break;
    default:
      BtnStyle = FilledButton;
      break;
  }

  return (
    <ButtonWrapper>
      <BtnStyle fontSize={fontSize}>{children}</BtnStyle>
    </ButtonWrapper>
  );
}

const ButtonWrapper = styled.div`
  &:hover button {
    transform: scale(0.95);
  }
`

const Btn = styled.button`
  font-size: ${({ fontSize }) => fontSize};
  font-family: var(--font-dm-sans),sans-serif;
  border-radius: 8px;
  
  padding: 4px 8px;
  transition: transform 0.1s ease-in-out;
  
  text-wrap: nowrap;
  
  border: solid 2px white;
`
const FilledButton = styled(Btn)`
  background-color: var(--color-blue-950);
  border-color: var(--color-blue-950);
  color: white;
`
const TransparentButton = styled(Btn)`
  background-color: transparent;
  border-color: transparent;
  color:black;
`

const OutlineButton = styled(Btn)`
  background-color: transparent;
  color: white;
  padding: -2px;
  border: solid 2px var(--color-orange-200);
`