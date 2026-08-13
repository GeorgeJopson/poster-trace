import React from 'react';
import CentralColumn from "@/components/CentralColumn";

import {QUERIES, ELEVATIONS} from "@/constants";
import styled from "styled-components";
import HeroButtonGroup from "@/components/Hero/HeroButtonGroup";


export default function Hero() {
  return (
    <HeroWrapper>
      <CentralColumn>
        <Title>Analytics for your Poster Campaign</Title>
        <HeroButtonGroup/>
      </CentralColumn>
    </HeroWrapper>
  );
}

const HeroWrapper = styled.div`
  border-radius: 0 0 var(--spacing-10) var(--spacing-10);

  background-image: linear-gradient(
          135deg,
          var(--color-orange-300) 0%,
          var(--color-orange-500) 100%
  );
  padding: 66px 0 16px 0;
  
  --shadow-color: var(--color-orange-300-fragment);
  box-shadow: ${ELEVATIONS.large};
`

const Title = styled.h1`
  font-size: ${80/16}rem;
  font-weight: 500;
  font-family: var(--font-sora), sans-serif;
  text-align: center;
  line-height: ${(96+16)/16}rem;

  @media ${QUERIES.tabletAndDown} {
    font-size: ${52/16}rem;
    line-height: ${(40+16)/16}rem;
  }
  @media ${QUERIES.phoneAndDown} {
    font-size: ${40/16}rem;
    line-height: ${(40+16)/16}rem;
  }
`