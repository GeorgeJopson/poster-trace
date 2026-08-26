import React from 'react';
import ContentGroup from "@/components/ContentGroup";
import styled from "styled-components";
import {QUERIES} from "@/constants";
import CentralColumn from "@/components/CentralColumn";

function Section1() {
  return (
    <Wrapper>
      <CentralColumn>
        <Title>
          Poster Analytics,<br/>
          For Communities,<br/>
          For Free.
        </Title>
      </CentralColumn>
    </Wrapper>

  );
}

export default Section1;

const Wrapper = styled(ContentGroup)`
  padding-top: calc(48px);
`

const Title = styled.h1`
  font-size: ${76/16}rem;
  line-height: 1.1;
  font-weight: 500;
  font-family: var(--font-bungee), sans-serif;
  text-align: left;
  
  color: var(--color-green-800);

  @media ${QUERIES.tabletAndDown} {
    font-size: ${52/16}rem;
  }
  @media ${QUERIES.phoneAndDown} {
    font-size: ${40/16}rem;
  }
`