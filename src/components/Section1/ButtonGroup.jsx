import React from 'react';
import Button from "@/components/Button";

import {QUERIES} from "@/constants";
import styled from "styled-components";
import Image from "next/image";

const scaleFactor = 0.65;

export default function ButtonGroup() {
  return (
    <Wrapper>
      <TabletAndUpWrapper>
        <Button type={"filled"} fontSize={`${36 / 16}rem`}>Sign Up</Button>
        <Button type={"transparent"} fontSize={`${32 / 16}rem`}>Learn More <InlineImage width={36} height={36} src={"/arrow-right.svg"} alt={"right arrow"}/></Button>
      </TabletAndUpWrapper>
      <PhoneAndDownWrapper>
        <Button type={"filled"} fontSize={`${36 / 16 * scaleFactor}rem`}>Sign Up</Button>
        <Button type={"transparent"} fontSize={`${32 / 16 * scaleFactor}rem`}>Learn More <InlineImage width={36*scaleFactor} height={36*scaleFactor} src={"/arrow-right.svg"} alt={"right arrow"}/></Button>
      </PhoneAndDownWrapper>
    </Wrapper>
  );
}

const InlineImage = styled(Image)`
  display: inline-block;
`

const Wrapper = styled.div`
  margin: 8px 0;
`

const ButtonWrapper = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: left;
`

const TabletAndUpWrapper = styled(ButtonWrapper)`
  gap: 24px;
  
  @media ${QUERIES.phoneAndDown}{
    display:none;
  }
`
const PhoneAndDownWrapper = styled(ButtonWrapper)`
  gap: 16px;
  
  display: none;
  @media ${QUERIES.phoneAndDown}{
    display:flex;
  }
`
