import styled from "styled-components";

import NavBar from "@/components/NavBar";
import CentralColumn from "@/components/CentralColumn";
import Button from "@/components/Button";
import {QUERIES, ELEVATIONS} from "@/constants";

// TODO: Add drop shadow to hero wrapper

export default function Home() {
  return (
    <main>
      <NavBar/>
      <HeroWrapper>
        <CentralColumn>
          <Title>Analytics for your Poster Campaign</Title>
          <ButtonWrapper>
            <ButtonWrapperSpacer/>
            <ButtonGroup>
              <Button type={"outline"} fontSize={`${36/16}rem`}>Log In</Button>
              <Button type={"filled"} fontSize={`${36/16}rem`}>Sign Up</Button>
            </ButtonGroup>
            <ButtonWrapperSpacer/>
          </ButtonWrapper>
        </CentralColumn>
      </HeroWrapper>
      <Spacer/>
    </main>
  );
}

const ButtonWrapperSpacer = styled.div`
  flex:1;
`

const ButtonWrapper = styled.div`
  display: flex;
  flex-direction: row;
`

const ButtonGroup = styled.div`
  flex:1;
  margin-top:22px;

  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 32px;
  @media ${QUERIES.phoneAndDown} {
    gap: 24px;
  }
`

const Spacer = styled.div`
  height: 300vh;
`

const HeroWrapper = styled.div`
  border-radius: 0 0 var(--spacing-10) var(--spacing-10);

  background-image: linear-gradient(
          135deg,
          var(--color-orange-300) 0%,
          var(--color-orange-500) 100%
  );
  padding: 66px 0 16px 0;
  
  --shadow-color: var(--color-orange-300-fragment);
  box-shadow: ${ELEVATIONS.large};
`

const Title = styled.h1`
  font-size: ${96/16}rem;
  font-weight: 600;
  font-family: var(--font-cascadia-mono),sans-serif;
  text-align: center;
  line-height: ${(96+16)/16}rem;

  @media ${QUERIES.tabletAndDown} {
    font-size: ${52/16}rem;
    line-height: ${(40+16)/16}rem;
  }
  @media ${QUERIES.phoneAndDown} {
    font-size: ${40/16}rem;
    line-height: ${(40+16)/16}rem;
  }
`