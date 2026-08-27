import React from 'react';
import ContentGroup from "@/components/ContentGroup";
import CentralColumn from "@/components/CentralColumn";
import styled from "styled-components";
import {areaChartImage, lineChartImage, mapChartImage} from "../../../public/imageDetails";
import Image from "next/image";
import {ELEVATIONS} from "@/constants";


function AnalyticsSection() {
  return (
    <ContentGroup>
      <CentralColumn>
        <Wrapper>
          <Card $width={231+12*2}>
            <CardText>Get real-time click through results, so you can see how interest is moving over time.</CardText>
            <ImageCard>
              <Image src={lineChartImage.src} alt={lineChartImage.alt} width={231} height={192}/>
            </ImageCard>
          </Card>
          <CardTwo $width={328+12*2}>
            <CardText>Gather A/B poster test results, so you can understand how different designs are performing with your audience.</CardText>
            <ImageCard>
              <Image src={areaChartImage.src} alt={areaChartImage.alt} width={328} height={192}/>
            </ImageCard>
          </CardTwo>
          <CardThree $width={270+12*2}>
            <CardText>Find out which areas are hotspots where your posters perform the best.</CardText>
            <ImageCard>
              <Image src={mapChartImage.src} alt={mapChartImage.alt} width={270} height={192}/>
            </ImageCard>
          </CardThree>
        </Wrapper>
      </CentralColumn>
    </ContentGroup>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  gap: 16px;
  flex-wrap: wrap;
  padding: 16px 0;
`

const CardText = styled.p`
`

const ImageCard = styled.div`
  padding: 12px;
  background-color: white;
  border-radius: 8px;
  --shadow-color: var(--color-green-800-fragment);
  box-shadow: ${ELEVATIONS.small};
`

const Card = styled.div`
  width: ${({ $width }) => $width}px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 4px;
`

const CardTwo = styled(Card)`
  @media(max-width: 1060px){
    display:none;
  }
`

const CardThree = styled(Card)`
  @media(max-width: 630px){
    display:none;
  }
`

export default AnalyticsSection;
