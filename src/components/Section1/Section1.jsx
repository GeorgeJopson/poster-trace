import React from 'react';
import ContentGroup from "@/components/ContentGroup";
import styled from "styled-components";
import CentralColumn from "@/components/CentralColumn";
import Title from "@/components/Section1/Title";
import ButtonGroup from "@/components/Section1/ButtonGroup";
import {QUERIES} from "@/constants";
import Image from "next/image";

const posterSize = 256;
const root2 = 1.414213562;

function Section1() {
  return (
    <Wrapper>
      <CentralColumn>
        <PosterThree
          width={posterSize}
          height={posterSize * root2}
          src={"/poster-images/stock-poster-3.png"}
          alt={
            "Poster Advertising Upcoming Events like a Grand Opening and Creative Gathering. " +
            "There is a QR code in the bottom right hand corner."}
        />

        <PosterTwo
          width={posterSize}
          height={posterSize * root2}
          src={"/poster-images/stock-poster-2.png"}
          alt={
            "Poster Advertising Upcoming Events like a Grand Opening and Creative Gathering. " +
            "There is a QR code in the bottom right hand corner."}
        />

        <PosterOne
          width={posterSize}
          height={posterSize * root2}
          src={"/poster-images/stock-poster-1.png"}
          alt={
            "Poster Advertising Upcoming Events like a Grand Opening and Creative Gathering. " +
            "There is a QR code in the bottom right hand corner."}
        />

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

const PosterImage = styled(Image)`
  position: absolute;
  width: auto;
  height: auto;
`

const PosterOne = styled(PosterImage)`
  top: 0;
  right: 10%;
  
  rotate: 4deg;
`

const PosterTwo = styled(PosterImage)`
  top: 30%;
  right: 5%;
  rotate: 8deg;
`

const PosterThree = styled(PosterImage)`
  top: 15%;
  right: 20%;
  rotate: -6deg;
`

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