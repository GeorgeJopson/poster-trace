import React from 'react';
import styled from "styled-components";
import Logo from "@/components/Logo";

export default function NavBar() {
  return (
    <NavBarWrapper>
      <Logo/>
      <ButtonGroup>
        <ButtonWrapper>
          <TransparentButton>Log In</TransparentButton>
        </ButtonWrapper>
        <ButtonWrapper>
          <FilledButton>Sign Up</FilledButton>
        </ButtonWrapper>
      </ButtonGroup>
    </NavBarWrapper>
  );
}

const NavBarWrapper = styled.div`
  border-radius: 8px;
  padding: 4px;

  position: fixed;
  top: 16px;
  left: 64px;
  right: 64px;

  display: flex;
  flex-direction: row;
  justify-content: space-between;
  
  background-image: linear-gradient(
          to left,
          var(--color-orange-300-transparent) 0%,
          var(--color-orange-200-transparent) 100%
  );
`

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: row;
  gap: 8px;
`

const ButtonWrapper = styled.div`
  &:hover button {
    transform: scale(0.95);
  }
`

const Button = styled.button`
  font-size: ${20/16}rem;
  font-family: var(--font-dm-sans),sans-serif;
  border-radius: 8px;

  color: white;
  border: none;
  padding: 4px 8px;
  transition: transform 0.1s ease-in-out;
`
const FilledButton = styled(Button)`
  background-color: var(--color-blue-950);
`
const TransparentButton = styled(Button)`
  background-color: transparent;
  color:black;
`