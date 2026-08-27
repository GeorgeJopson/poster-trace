import React from 'react';
import Header from "@/components/Header";
import CentralColumn from "@/components/CentralColumn";
import styled from "styled-components";
import ProblemCard from "@/components/ProblemSection/ProblemCard";
import {Clipboard, Database, MapPin} from "feather-icons-react";

export default function ProblemSection() {
  return (
    <Wrapper>
      <CentralColumn>
        <Header type={"heading"}>
          The&nbsp;Problem
        </Header>
        <ProblemCardGroup>
          <ProblemCard icon={<Clipboard size={64} strokeWidth={"1.5px"} color={"var(--color-green-800)"}/>} title={"No Information"}>You have no idea where your posters are actually working, and where people are just walking past.</ProblemCard>
          <ProblemCard icon={<MapPin size={64} strokeWidth={"1.5px"} color={"var(--color-green-800)"}/>} title={"No Record"}>If you find a great spot, you have no way of remembering where it is for your next poster campaign.</ProblemCard>
          <ProblemCard icon={<Database size={64} strokeWidth={"1.5px"} color={"var(--color-green-800)"}/>} title={"No System"}>All your marketing information is spread across countless docs and websites.</ProblemCard>
        </ProblemCardGroup>
      </CentralColumn>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  padding: 16px 0;
`

const ProblemCardGroup = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 32px;
  row-gap: 32px;
  align-items: stretch;
  padding-top: 16px;
`
