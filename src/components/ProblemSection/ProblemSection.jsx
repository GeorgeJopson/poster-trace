import React from 'react';
import Header from "@/components/Header";
import CentralColumn from "@/components/CentralColumn";
import styled from "styled-components";
import ProblemCard from "@/components/ProblemSection/ProblemCard";
import Image from "next/image";
import {clipboardIcon, databaseIcon, mapIcon} from "../../../public/imageDetails";

export default function ProblemSection() {
  return (
    <Wrapper>
      <CentralColumn>
        <Header type={"heading"}>
          The&nbsp;Problem
        </Header>
        <ProblemCardGroup>
          <ProblemCard icon={<Image width={64} height={64} src={clipboardIcon.src} alt={clipboardIcon.alt}/>} title={"No Information"}>You have no idea where your posters are actually working, and where people are just walking past.</ProblemCard>
          <ProblemCard icon={<Image width={64} height={64} src={mapIcon.src} alt={mapIcon.alt}/>} title={"No Record"}>If you find a great spot, you have no way of remembering where it is for your next poster campaign.</ProblemCard>
          <ProblemCard icon={<Image width={64} height={64} src={databaseIcon.src} alt={databaseIcon.alt}/>} title={"No System"}>All your marketing information is spread across countless docs and websites.</ProblemCard>
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
  gap: 16px;
  row-gap: 16px;
  align-items: stretch;
  padding-top: 16px;
`
