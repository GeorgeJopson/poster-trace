import React from 'react';
import ContentGroup from "@/components/ContentGroup";
import styled from "styled-components";
import CentralColumn from "@/components/CentralColumn";
import Title from "@/components/Section1/Title";
import ButtonGroup from "@/components/Section1/ButtonGroup";
import {QUERIES} from "@/constants";

function Section1() {
  return (
    <Wrapper>
      <CentralColumn>
        <Title>
          Poster&nbsp;Analytics,<br/>
          For&nbsp;Communities,<br/>
          For&nbsp;Free.
        </Title>
        <Introduction>
          <p>Revolutionise your poster campaigns, by finally getting the data you need.</p>
          <p>Generate posters, log their locations as you put them up, and let the analytics roll in.</p>
          <ButtonGroup/>
        </Introduction>
      </CentralColumn>
    </Wrapper>

  );
}

export default Section1;

const Wrapper = styled(ContentGroup)`
  padding-top: calc(48px);
`

const Introduction = styled.div`
  padding-top: 16px;
  color: var(--color-green-950);
  font-size: ${24/16}rem;
  max-width: 36ch;
  display: flex;
  flex-direction: column;
  gap: 8px;
  
  @media ${QUERIES.phoneAndDown}{
    font-size: ${16/16}rem;
  }
`