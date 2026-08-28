import React from 'react';
import ContentGroup from "@/components/ContentGroup";
import CentralColumn from "@/components/CentralColumn";
import styled from "styled-components";
import SignUpNowBtn from "@/components/CallToAction/SignUpNowBtn";

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
  padding: 32px 0;
`
const Box = styled.div`
  background-color: var(--color-green-950);
  padding: 32px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-radius: 48px;
  gap: 32px;
`

const BoxHeader = styled.div`
  color: white;
  font-size: ${64/16}rem;
  max-width: 23ch;
  text-align: center;
  line-height: 1.2;
`

