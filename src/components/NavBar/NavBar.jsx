import React from 'react';
import styled from "styled-components";
import Logo from "@/components/Logo";

export default function NavBar() {
  return (
    <NavBarWrapper>
      <Logo/>
    </NavBarWrapper>
  );
}

const NavBarWrapper = styled.div`
  border-radius: 8px;
  padding: 0 4px;

  position: fixed;
  top: 16px;
  left: 64px;
  right: 64px;

  
  background-image: linear-gradient(
          to left,
          var(--color-orange-300-transparent) 0%,
          var(--color-orange-200-transparent) 100%
  );

`