import React from 'react';
import ContentGroup from "@/components/ContentGroup";
import styled from "styled-components";
import CentralColumn from "@/components/CentralColumn";
import Title from "@/components/Section1/Title";
import ButtonGroup from "@/components/Section1/ButtonGroup";
import {BREAKPOINTS, QUERIES} from "@/constants";
import Image from "next/image";

const posterSize = 256;
const root2 = 1.414213562;

const switchPoint =`(max-width: ${760 / 16}rem)`;

function Section1() {
  return (
    <Wrapper>


      <CentralColumn>
        <FlexWrapper>
          <Posters>
            <PosterThree>
              <Image
                src={"/poster-images/stock-poster-3.png"}
                alt={
                  "Poster Advertising Upcoming Events like a Grand Opening and Creative Gathering. " +
                  "There is a QR code in the bottom right hand corner."}
                fill
              />
            </PosterThree>

            <PosterTwo>
              <Image
                fill
                src={"/poster-images/stock-poster-2.png"}
                alt={
                  "Poster Advertising Upcoming Events like a Grand Opening and Creative Gathering. " +
                  "There is a QR code in the bottom right hand corner."}
              />
            </PosterTwo>

            <PosterOne>
              <Image
                fill
                src={"/poster-images/stock-poster-1.png"}
                alt={
                  "Poster Advertising Upcoming Events like a Grand Opening and Creative Gathering. " +
                  "There is a QR code in the bottom right hand corner."}
              />
            </PosterOne>
          </Posters>



          <LeftWrapper>
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
          </LeftWrapper>

          <PostersForSmall>
            <PosterSmallWrapper>
              <Image
                src={"/poster-images/stock-poster-2.png"}
                alt={
                  "Poster Advertising Upcoming Events like a Grand Opening and Creative Gathering. " +
                  "There is a QR code in the bottom right hand corner."}
                fill
              />
            </PosterSmallWrapper>
            <PosterSmallWrapper>
              <Image
                src={"/poster-images/stock-poster-3.png"}
                alt={
                  "Poster Advertising Upcoming Events like a Grand Opening and Creative Gathering. " +
                  "There is a QR code in the bottom right hand corner."}
                fill
              />
            </PosterSmallWrapper>
            <PosterSmallWrapper>
              <Image
                src={"/poster-images/stock-poster-4.png"}
                alt={
                  "Poster Advertising Upcoming Events like a Grand Opening and Creative Gathering. " +
                  "There is a QR code in the bottom right hand corner."}
                fill
              />
            </PosterSmallWrapper>
          </PostersForSmall>
        </FlexWrapper>
      </CentralColumn>
    </Wrapper>

  );
}

export default Section1;

const LeftWrapper = styled.div`
  position: relative;
  
`

const PostersForSmall = styled.div`
  display: none;
  
  padding: 16px 0;
  
  @media  ${switchPoint}{
    display: flex;
    flex-direction: row;
    justify-content: space-around;
  }
`

const FlexWrapper = styled.div`
  display: flex;
  flex-direction: row-reverse;
  @media  ${switchPoint}{
    flex-direction: column;
  }
`

const Posters = styled.div`
  position: relative;
  flex:1;
  @media  ${switchPoint}{
    display: none;
  }
}
`

const PosterSmallWrapper = styled.div`
  --scale-factor: 0.6;
  @media ${QUERIES.phoneAndDown}{
    --scale-factor: 0.4;
  }
  @media ${QUERIES.smallPhoneAndDown}{
    --scale-factor: 0.35;
  }
  width: calc(${posterSize}px * var(--scale-factor));
  height: calc(${posterSize*root2}px * var(--scale-factor));
  position: relative;
  
  &:nth-of-type(1){
    rotate: -8deg;
  }
  &:nth-of-type(2){
    rotate: 4deg;
  }
  &:nth-of-type(3){
    rotate: -6deg;
  }
`

const PosterWrapper = styled.div`
  position: absolute;
  
  --scaleFactor: 1;
  
  width:calc(${posterSize}px * var(--scaleFactor));
  height:calc(${posterSize * root2}px * var(--scaleFactor));
  
  @media ${QUERIES.laptopAndDown}{
    --scaleFactor: 0.8;
  }

`

const PosterOne = styled(PosterWrapper)`
  top: 16px;
  left: 60%;
  rotate: 4deg;
  transform: translateX(-50%);
  @media ${QUERIES.tabletAndDown}{
    top: 50%;
    transform: translate(-50%, -50%);
  }
`

const PosterTwo = styled(PosterWrapper)`
  top: 160px;
  left: 60%;
  rotate: 16deg;
  transform: translateX(calc(-50% + min(128px, 15vw - 100px)));
  @media ${QUERIES.tabletAndDown}{
    display: none;
  }
`

const PosterThree = styled(PosterWrapper)`
  top: 32px;
  left: 60%;
  rotate: -8deg;
  transform: translateX(calc(-50% - min(128px, 15vw - 100px)));
  @media ${QUERIES.tabletAndDown}{
    display: none;
  }
`

const Wrapper = styled(ContentGroup)`
  padding-top: calc(48px);
  position: relative;
  overflow-x: clip;
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
    font-size: ${20/16}rem;
  }
  @media ${QUERIES.smallPhoneAndDown}{
    font-size: ${16/16}rem;
  }
`