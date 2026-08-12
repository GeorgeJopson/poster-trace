import styled from "styled-components";

import NavBar from "@/components/NavBar";
import CentralColumn from "@/components/CentralColumn";

export default function Home() {
  return (
    <main>
      <NavBar/>
      <HeroWrapper>
        <CentralColumn>
          <Title>Analytics for your Poster Campaign</Title>
        </CentralColumn>
      </HeroWrapper>
      <Spacer/>
    </main>
  );
}

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
`

const Title = styled.h1`
  font-size: ${96/16}rem;
  font-weight: 600;
  font-family: var(--font-cascadia-mono),sans-serif;
  text-align: center;
  line-height: ${(96+16)/16}rem;
`