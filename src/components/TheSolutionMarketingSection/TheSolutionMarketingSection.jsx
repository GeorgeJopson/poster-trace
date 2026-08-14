import styled from "styled-components";

import Header from "@/components/Header";
import CentralColumn from "@/components/CentralColumn";
import React from "react";
import List from "@/components/TheSolutionMarketingSection/List";
import Image from "next/image";
import {QUERIES} from "@/constants";

export default function TheSolutionMarketingSection() {
  return (
    <ProblemSection>
      <CentralColumn>
        <ColumnLayoutWrapper>
          <Column>
            <SolutionHeader>The Solution</SolutionHeader>
            <List>
              <>Create a campaign, give us a link for what you’re trying to advertise, and position the created QR code
                on your poster page!
              </>
              <>Print of as many posters as you want, and register them by scanning their QR codes as you put them
                up.
              </>
              <>Sit back, relax, and watch the analytics roll in. Whenever one of your posters is scanned, you get a log
                telling you when and where.
              </>
            </List>
          </Column>
          <ImageColumn>
            <ImageSeven>
              <Image loading="lazy" src={"/poster-images/poster-image-7.jpg"} width={264} height={198} alt={"Picture of Posters"}/>
              <DarkTint/>
            </ImageSeven>
            <ImageSix>
              <Image loading="lazy" src={"/poster-images/poster-image-6.jpg"} width={264} height={198} alt={"Picture of Posters"}/>
              <DarkTint/>
            </ImageSix>
            <ImageFive>
              <Image loading="lazy" src={"/poster-images/poster-image-4.jpg"} width={161} height={240} alt={"Picture of Posters"}/>
              <DarkTint/>
            </ImageFive>
            <ImageFour>
              <Image loading="lazy" src={"/poster-images/poster-image-3.jpg"} width={275} height={183} alt={"Picture of Posters"}/>
              <DarkTint/>
            </ImageFour>
            <ImageThree>
              <Image loading="lazy" src={"/poster-images/poster-image-5.jpg"} width={205} height={270} alt={"Picture of Posters"}/>
              <DarkTint/>
            </ImageThree>
            <ImageTwo>
              <Image loading="lazy" src={"/poster-images/poster-image-2.jpg"} width={264} height={198} alt={"Picture of Posters"}/>
              <DarkTint/>
            </ImageTwo>
            <ImageOne>
              <Image loading="lazy" src={"/poster-images/poster-image-1.jpg"} width={285} height={203} alt={"Picture of Posters"}/>
              <Tint/>
            </ImageOne>
          </ImageColumn>
        </ColumnLayoutWrapper>
      </CentralColumn>
    </ProblemSection>
  );
}

const ImageWrapper = styled.div`
  overflow:clip;
  position: absolute;
  border-radius: 8px;
`

const ImageOne = styled(ImageWrapper)`
  top:50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(4deg);
  width: 285px;
  @media ${QUERIES.phoneAndDown} {
    width: 275px;
  }
`

const ImageForDesktop = styled(ImageWrapper)`
  @media ${QUERIES.tabletAndDown} {
    display: none;
  }
`

const ImageTwo = styled(ImageForDesktop)`
  top:10%;
  left:10%;
  transform: rotate(-4deg);
`

const ImageThree = styled(ImageForDesktop)`
  top:5%;
  right:4%;
  transform: rotate(-8deg);
`
const ImageFour = styled(ImageForDesktop)`
  bottom:5%;
  left:6%;
  transform: rotate(8deg);
`
const ImageFive = styled(ImageForDesktop)`
  bottom: 1%;
  right: 5%;
  transform: rotate(20deg);
`
const ImageSix = styled(ImageForDesktop)`
  top:1%;
  left: 50%;
  transform: translateX(-50%) rotate(4deg);
`

const ImageSeven = styled(ImageForDesktop)`
  bottom: 0;
  left: 50%;
  transform: translateX(-50%) rotate(2deg);
`

const Tint = styled.div`
  width: 100%;
  height: 100%;
  background-color: var(--color-orange-50);
  opacity:0.1;
  position: absolute;
  top:0;
  left:0;
`

const DarkTint = styled(Tint)`
  background-color: var(--color-orange-600);
`


const ProblemSection = styled.section`
  padding-top: 32px;
  padding-bottom: 48px;
`

const ColumnLayoutWrapper = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  row-gap: 16px;
`

const Column = styled.div`
  flex: 1;
  min-width: ${340 / 16}rem;
  position: relative;
  @media ${QUERIES.phoneAndDown} {
    min-width: ${288 / 16}rem;
  }
`

const ImageColumn = styled(Column)`
  min-height: 220px;
`

const SolutionHeader = styled(Header)`
  text-align: left;
`