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
            <ProblemCardGroup>
              <ProblemCard>
                <ProblemCardTitle>No Information:</ProblemCardTitle>
                <ProblemCardContent>You have no idea where your posters are actually working, and where people are just walking past.</ProblemCardContent>
              </ProblemCard>
              <ProblemCard>
                <ProblemCardTitle>No Record:</ProblemCardTitle>
                <ProblemCardContent>If you find a great spot, you have no way of remembering where it is for your next poster campaign.</ProblemCardContent>
              </ProblemCard>
              <ProblemCard>
                <ProblemCardTitle>No Information:</ProblemCardTitle>
                <ProblemCardContent>All your marketing information is spread across countless docs and websites.</ProblemCardContent>
              </ProblemCard>
            </ProblemCardGroup>
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
const ProblemCardGroup = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  gap: 64px;
  row-gap: 32px;
  align-items: stretch;
  padding-top: 16px;
`

const ProblemCard = styled.div`
  background-color: white;
  border-radius: 8px;
  border: 1px solid var(--color-orange-900);
  padding: 12px;
`

const ProblemCardTitle = styled.h3`
  font-size: ${20/16}rem;
  font-weight: bold;
`

const ProblemCardContent = styled.p`
  font-size: ${16/16}rem;
  width: 260px;
`