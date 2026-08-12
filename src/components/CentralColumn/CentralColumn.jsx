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
  width: 64px;
  @media ${QUERIES.tabletAndDown} {
    width: 32px;
  }
  @media ${QUERIES.phoneAndDown} {
    width: 16px;
  }
`

const CentralDiv = styled.div`
  max-width: 1200px;
  flex:1;
`