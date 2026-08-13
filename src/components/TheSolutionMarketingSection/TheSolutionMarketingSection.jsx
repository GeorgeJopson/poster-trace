import styled from "styled-components";

import Header from "@/components/Header";
import CentralColumn from "@/components/CentralColumn";
import React from "react";
import List from "@/components/TheSolutionMarketingSection/List";

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
          <Column></Column>
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
`

const Column = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: ${256 / 16}rem;
`

const SolutionHeader = styled(Header)`
  text-align: left;
`