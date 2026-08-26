import React from 'react';
import styled from "styled-components";
import Logo from "@/components/Logo";
import Button from "@/components/Button";

export default function NavBar() {
  return (
    <NavBarWrapper>
      <Logo/>
      <ButtonGroup>
        <Button type={"transparent"} fontSize={`${20/16}rem`}>Log In</Button>
        <Button type={"filled"} fontSize={`${20/16}rem`}>Sign Up</Button>
      </ButtonGroup>
    </NavBarWrapper>
  );
}

const NavBarWrapper = styled.div`
  padding: 4px;

  position: fixed;
  top: 0;
  left: 0;
  right: 0;

  display: flex;
  flex-direction: row;
  justify-content: space-between;
  
  background-color: white;
  
  border-bottom: 2px solid var(--color-green-800);
`

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: row;
  gap: 8px;
  align-items: center;
`