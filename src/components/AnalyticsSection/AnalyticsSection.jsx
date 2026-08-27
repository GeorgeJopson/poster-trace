import React from 'react';
import ContentGroup from "@/components/ContentGroup";
import CentralColumn from "@/components/CentralColumn";
import styled from "styled-components";
import {areaChartImage, lineChartImage, mapChartImage} from "../../../public/imageDetails";
import Image from "next/image";


function AnalyticsSection() {
  return (
    <ContentGroup>
      <CentralColumn>
        <Wrapper>
          <Image src={lineChartImage.src} alt={lineChartImage.alt} width={308} height={256}/>
          <Image src={areaChartImage.src} alt={areaChartImage.alt} width={437} height={256}/>
          <Image src={mapChartImage.src} alt={mapChartImage.alt} width={360} height={256}/>
        </Wrapper>
      </CentralColumn>
    </ContentGroup>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-around;
`

export default AnalyticsSection;
