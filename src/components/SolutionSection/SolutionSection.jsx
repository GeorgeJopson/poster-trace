import styled from "styled-components";

import Header from "@/components/Header";
import CentralColumn from "@/components/CentralColumn";
import React from "react";
import List from "@/components/SolutionSection/List";
import {QUERIES} from "@/constants";
import PosterRow from "@/components/SolutionSection/PosterRow";

export default function SolutionSection() {
  return (
    <ProblemSection>
      <CentralColumn>
        <ColumnLayoutWrapper>

          <ImageColumn>
            <PosterRow/>
          </ImageColumn>
          <TextColumn>
            <SolutionHeader type={"heading"}>The&nbsp;Solution</SolutionHeader>
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
          </TextColumn>
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
`

const Column = styled.div`
  flex: 1;
  position: relative;
`

const TextColumn = styled(Column)`
  min-width: ${340 / 16}rem;
  @media ${QUERIES.phoneAndDown} {
    min-width: ${288 / 16}rem;
  }
`

const ImageColumn = styled(Column)`
  flex:1.5;
  @media ${QUERIES.smallPhoneAndDown} {
    display: none;
  }
`

const SolutionHeader = styled(Header)`
  text-align: right;
  min-width: 11ch;
`