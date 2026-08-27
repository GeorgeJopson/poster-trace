import React from 'react';
import styled from "styled-components";
import HeaderButtonGroup from "@/components/Hero/HeaderButtonGroup";
import {QUERIES} from "@/constants";
import Header from "@/components/Header";


export default function HeaderContent() {
  return (
    <div>
      <Header type={"title"}>
        Poster&nbsp;Analytics,<br/>
        For&nbsp;Communities,<br/>
        For&nbsp;Free.
      </Header>
      <Introduction>
        <p>Revolutionise your poster campaigns, by finally getting the data you need.</p>
        <p>Generate posters, log their locations as you put them up, and let the analytics roll in.</p>
        <HeaderButtonGroup/>
      </Introduction>
    </div>
  );
}


const Introduction = styled.div`
  padding-top: 16px;
  color: var(--color-green-950);
  font-size: ${24 / 16}rem;
  max-width: 36ch;
  display: flex;
  flex-direction: column;
  gap: 8px;
  @media ${QUERIES.phoneAndDown} {
    font-size: ${20 / 16}rem;
  }
  @media ${QUERIES.smallPhoneAndDown} {
    font-size: ${16 / 16}rem;
  }
`