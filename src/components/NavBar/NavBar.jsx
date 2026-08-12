import React from 'react';
import styled from "styled-components";
import Logo from "@/components/Logo";
import Button from "@/components/Button";
import {QUERIES} from "@/constants";

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
  border-radius: 8px;
  padding: 4px;

  position: fixed;
  top: 16px;

  display: flex;
  flex-direction: row;
  justify-content: space-between;
  
  background-image: linear-gradient(
          to left,
          var(--color-orange-300-transparent) 0%,
          var(--color-orange-200-transparent) 100%
  );
  
  --side-margin: 64px;
  @media ${QUERIES.tabletAndDown} {
    --side-margin: 32px;
  }
  @media ${QUERIES.phoneAndDown} {
    --side-margin: 16px;
  }
  left: var(--side-margin);
  right: var(--side-margin);
`

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: row;
  gap: 8px;
`