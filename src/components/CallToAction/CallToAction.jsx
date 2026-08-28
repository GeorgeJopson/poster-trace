import React from 'react';
import ContentGroup from "@/components/ContentGroup";
import CentralColumn from "@/components/CentralColumn";
import styled from "styled-components";
import SignUpNowBtn from "@/components/CallToAction/SignUpNowBtn";
import {QUERIES} from "@/constants";

export default function CallToAction() {
  return (
    <ContentGroup>
      <CentralColumn>
        <CallToActionWrapper>
          <Box>
            <BoxHeader>
              Take the guess work out of your posters.
            </BoxHeader>
            <SignUpNowBtn>Sign Up Now</SignUpNowBtn>
          </Box>
        </CallToActionWrapper>
      </CentralColumn>
    </ContentGroup>
  );
}

const CallToActionWrapper = styled.div`
  padding: 8px 0 16px;
`
const Box = styled.div`
  background-color: var(--color-green-950);
  padding: 32px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-radius: 48px;
  gap: 32px;
`

const BoxHeader = styled.div`
  color: white;
  max-width: 23ch;
  text-align: center;
  line-height: 1.2;

  font-size: ${60/16}rem;
  @media ${QUERIES.laptopAndDown}{
    font-size: ${56/16}rem;
  }
  @media ${QUERIES.tabletAndDown} {
    font-size: ${44/16}rem;
  }
  @media ${QUERIES.phoneAndDown} {
    font-size: ${40/16}rem;
  }
  @media ${QUERIES.smallPhoneAndDown} {
    font-size: ${36/16}rem;
  }
`

