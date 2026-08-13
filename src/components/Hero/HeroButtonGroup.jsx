import React from 'react';
import Button from "@/components/Button";

import {QUERIES} from "@/constants";
import styled from "styled-components";

export default function HeroButtonGroup() {
  return (
    <ButtonWrapper>
      <ButtonWrapperSpacer/>
      <ButtonGroup>
        <Button type={"outline"} fontSize={`${36 / 16}rem`}>Log In</Button>
        <Button type={"filled"} fontSize={`${36 / 16}rem`}>Sign Up</Button>
      </ButtonGroup>
      <ButtonWrapperSpacer/>
    </ButtonWrapper>
  );
}

const ButtonWrapper = styled.div`
  display: flex;
  flex-direction: row;
`

const ButtonWrapperSpacer = styled.div`
  flex: 1;
`

const ButtonGroup = styled.div`
  flex: 1;
  margin-top: 22px;

  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 32px;
  @media ${QUERIES.phoneAndDown} {
    gap: 24px;
  }
`