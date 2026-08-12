import React from 'react';
import styled from "styled-components";
import {Aperture} from 'feather-icons-react';

function Logo() {
  return (
    <LogoWrapper>
      <Aperture size={28} strokeWidth={"1.5px"}/>
      <LogoTitle>PosterTrace</LogoTitle>
    </LogoWrapper>
  );
}


const LogoWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;

  gap: 8px;
`

const LogoTitle = styled.p`
  font-size: calc(32 / 16 * 1rem);
  font-weight: 900;
  font-family: var(--font-dm-sans), sans-serif;
`

export default Logo;
