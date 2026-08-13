import styled from "styled-components";

import Header from "@/components/Header";
import CentralColumn from "@/components/CentralColumn";
import React from "react";

export default function TheSolutionMarketingSection() {
  return (
    <ProblemSection>
      <CentralColumn>
        <ColumnLayoutWrapper>
          <Column>
            <SolutionHeader>The Solution</SolutionHeader>
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
  flex-direction:row;
`

const Column = styled.div`
  flex:1;
  display: flex;
  flex-direction: column;
`

const SolutionHeader = styled(Header)`
  text-align: left;
`