import React from 'react';
import styled from "styled-components";
import Logo from "@/components/Logo";
import Button from "@/components/Button";

export default function NavBar() {
  return (
    <NavBarWrapper>
      <Logo/>
      <ButtonGroup>
        <Button type={"transparent"}>Log In</Button>
        <Button type={"filled"}>Sign Up</Button>
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