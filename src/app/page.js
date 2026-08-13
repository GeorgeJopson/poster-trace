import styled from "styled-components";

import NavBar from "@/components/NavBar";
import Hero from "@/components/Hero";
import Header from "@/components/Header";
import CentralColumn from "@/components/CentralColumn";

export default function Home() {
  return (
    <main>
      <NavBar/>
      <ContentGroup>
        <Hero/>
        <ProblemSection>
          <CentralColumn>
            <Header>The Problem</Header>
          </CentralColumn>
        </ProblemSection>
      </ContentGroup>
      <Spacer/>
    </main>
  );
}

const ProblemSection = styled.section`
  padding-top: 32px;
`

const ContentGroup = styled.div`
  padding-bottom: 64px;
  background-color: var(--color-orange-50);
`

const Spacer = styled.div`
  height: 300vh;
`