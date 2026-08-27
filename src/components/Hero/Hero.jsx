import React from 'react';
import ContentGroup from "@/components/ContentGroup";
import styled from "styled-components";
import CentralColumn from "@/components/CentralColumn";
import {QUERIES} from "@/constants";
import PosterFan from "@/components/Hero/PosterFan";
import HeaderContent from "@/components/Hero/HeaderContent";
import PosterRow from "@/components/Hero/PosterRow";
import Header from "@/components/Hero/Header";


function Hero() {
  return (
    <Wrapper>
      <CentralColumn>
        <ContentWrapper>

          <TopRow>
            <PosterFanWrapper>
              <PosterFan/>
            </PosterFanWrapper>
            <HeaderContent/>
          </TopRow>

          <BottomRow>
            <PosterRow/>
          </BottomRow>

          <ProblemWrapper>
            <Header type={"heading"}>
              The&nbsp;Problem
            </Header>
          </ProblemWrapper>

        </ContentWrapper>
      </CentralColumn>
    </Wrapper>

  );
}

export default Hero;

const ProblemWrapper = styled.div``

const Wrapper = styled(ContentGroup)`
  padding-top: calc(48px);
  overflow-x: clip;
`

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
`

const posterFanHideBreakpoint =`(max-width: ${760 / 16}rem)`;

const TopRow = styled.div`
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

const BottomRow = styled.div`
  display: none;
  @media  ${QUERIES.tabletAndDown}{
    display: revert;
  }
`