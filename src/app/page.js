import styled from "styled-components";

import NavBar from "@/components/NavBar";
import Hero from "@/components/Hero";
import Header from "@/components/Header";
import CentralColumn from "@/components/CentralColumn";
import {Clipboard, MapPin, Database} from "feather-icons-react";
import React from "react";
import {ELEVATIONS} from "@/constants";

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
                <ProblemCardIcon><Clipboard size={64} strokeWidth={"1.5px"} color={"var(--color-orange-700)"}/></ProblemCardIcon>
                <ProblemCardTitle>No Information:</ProblemCardTitle>
                <ProblemCardContent>You have no idea where your posters are actually working, and where people are just walking past.</ProblemCardContent>
              </ProblemCard>
              <ProblemCard>
                <ProblemCardIcon><MapPin size={64} strokeWidth={"1.5px"} color={"var(--color-orange-700)"}/></ProblemCardIcon>
                <ProblemCardTitle>No Record:</ProblemCardTitle>
                <ProblemCardContent>If you find a great spot, you have no way of remembering where it is for your next poster campaign.</ProblemCardContent>
              </ProblemCard>
              <ProblemCard>
                <ProblemCardIcon><Database size={64} strokeWidth={"1.5px"} color={"var(--color-orange-700)"}/></ProblemCardIcon>
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

const ProblemCardIcon = styled.div`
  position: absolute;
  top: 16px;
  left: 4px;
`

const ProblemSection = styled.section`
  padding-top: 32px;
`

const ContentGroup = styled.div`
  padding-bottom: 48px;
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
  position: relative;
  background-color: white;
  border-radius: 8px;
  border: 1px solid var(--color-orange-900);
  padding: 12px 12px 12px 72px;

  --shadow-color: var(--color-orange-200-fragment);
  box-shadow: ${ELEVATIONS.medium};
`

const ProblemCardTitle = styled.h3`
  font-size: ${20/16}rem;
  font-weight: bold;
`

const ProblemCardContent = styled.p`
  font-size: ${16/16}rem;
  max-width: 260px;
`