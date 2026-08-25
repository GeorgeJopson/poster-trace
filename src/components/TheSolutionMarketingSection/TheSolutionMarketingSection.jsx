import styled from "styled-components";

import Header from "@/components/Header";
import CentralColumn from "@/components/CentralColumn";
import React from "react";
import List from "@/components/TheSolutionMarketingSection/List";
import {QUERIES} from "@/constants";
import PosterImage from "@/components/TheSolutionMarketingSection/PosterImage";

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
            <PosterImage desktopOnly image={"/poster-images/poster-image-7.jpg"} width={264} height={198} posX={"50%"} posY={"50%"} tilt={4}/>
            <PosterImage desktopOnly image={"/poster-images/poster-image-6.jpg"} width={264} height={198} posX={"50%"} posY={"1%"} tilt={4}/>
            <PosterImage desktopOnly image={"/poster-images/poster-image-5.jpg"} width={205} height={270} posX={"80%"} posY={"5%"} tilt={-8}/>
            <PosterImage desktopOnly image={"/poster-images/poster-image-4.jpg"} width={161} height={240} posX={"80%"} posY={"40%"} tilt={15}/>
            <PosterImage desktopOnly image={"/poster-images/poster-image-3.jpg"} width={275} height={183} posX={"33%"} posY={"45%"} tilt={8}/>
            <PosterImage desktopOnly image={"/poster-images/poster-image-2.jpg"} width={264} height={198} posX={"33%"} posY={"10%"} tilt={-4}/>
            <PosterImage image={"/poster-images/poster-image-1.jpg"} width={275} height={203} posX={"50%"} posY={"20%"} tilt={4}/>
          </ImageColumn>
        </ColumnLayoutWrapper>
      </CentralColumn>
    </ProblemSection>
  );
}

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