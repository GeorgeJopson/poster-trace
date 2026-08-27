import React from 'react';
import ContentGroup from "@/components/ContentGroup";
import styled from "styled-components";
import CentralColumn from "@/components/CentralColumn";
import {QUERIES} from "@/constants";
import PosterFan from "@/components/Hero/PosterFan";
import HeaderContent from "@/components/Hero/HeaderContent";
import PosterRow from "@/components/Hero/PosterRow";


function Hero() {
  return (
    <Wrapper>
      <CentralColumn>
        <ContentWrapper>

          <HeaderSection>
            <PosterFanWrapper>
              <PosterFan/>
            </PosterFanWrapper>
            <HeaderContent/>
          </HeaderSection>

          <PosterRowSection>
            <PosterRow/>
          </PosterRowSection>

        </ContentWrapper>
      </CentralColumn>
    </Wrapper>

  );
}

export default Hero;

const Wrapper = styled(ContentGroup)`
  padding-top: calc(48px);
  overflow-x: clip;
  margin-bottom: 36px;
  isolation: isolate;
`

const ContentWrapper = styled.div`
  padding-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const posterFanHideBreakpoint =`(max-width: ${760 / 16}rem)`;

const HeaderSection = styled.header`
  display: flex;
  flex-direction: row-reverse;
  @media ${posterFanHideBreakpoint}{
    flex-direction: row;
  }
`

const PosterFanWrapper = styled.div`
  position: relative;
  flex:1;
  @media  ${posterFanHideBreakpoint}{
    display: none;
  }
}
`

const PosterRowSection = styled.div`
  margin-bottom: -32px;
  display: none;
  @media  ${QUERIES.tabletAndDown}{
    display: revert;
  }
`