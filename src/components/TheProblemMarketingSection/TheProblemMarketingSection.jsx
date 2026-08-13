import styled from "styled-components";

import Header from "@/components/Header";
import CentralColumn from "@/components/CentralColumn";
import {Clipboard, MapPin, Database} from "feather-icons-react";
import React from "react";
import ProblemCard from "@/components/TheProblemMarketingSection/ProblemCard";

export default function TheProblemMarketingSection() {
  return (
    <ProblemSection>
      <CentralColumn>
        <Header>The Problem</Header>
        <ProblemCardGroup>
          <ProblemCard icon={<Clipboard size={64} strokeWidth={"1.5px"} color={"var(--color-orange-700)"}/>} title={"No Information"}>You have no idea where your posters are actually working, and where people are just walking past.</ProblemCard>
          <ProblemCard icon={<MapPin size={64} strokeWidth={"1.5px"} color={"var(--color-orange-700)"}/>} title={"No Record"}>If you find a great spot, you have no way of remembering where it is for your next poster campaign.</ProblemCard>
          <ProblemCard icon={<Database size={64} strokeWidth={"1.5px"} color={"var(--color-orange-700)"}/>} title={"No System"}>All your marketing information is spread across countless docs and websites.</ProblemCard>
        </ProblemCardGroup>
      </CentralColumn>
    </ProblemSection>
  );
}

const ProblemSection = styled.section`
  padding-top: 32px;
  padding-bottom: 48px;
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

