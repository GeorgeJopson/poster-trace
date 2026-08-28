import React from 'react';
import styled from "styled-components";
import {QUERIES} from "@/constants";

function CentralColumn({children}) {
  return <Wrapper>
    <Spacer/>
    <CentralDiv>{children}</CentralDiv>
    <Spacer/>
  </Wrapper>;
}

export default CentralColumn;

const Wrapper = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
`

const Spacer = styled.div`
  min-width: 64px;
  @media ${QUERIES.tabletAndDown} {
    min-width: 32px;
  }
  @media ${QUERIES.phoneAndDown} {
    min-width: 16px;
  }
`

const CentralDiv = styled.div`
  flex:1;
  position: relative;
`