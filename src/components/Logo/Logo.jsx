import React from 'react';
import styled from "styled-components";
import Link from "next/link";
import {QUERIES} from "@/constants";
import Image from "next/image";

export default function Logo() {
  return (
      <LogoWrapper href={"/"}>
        <Image width={36} height={36} src={"/logo.svg"} alt={"Poster Trace Logo"}/>
        <LogoTitle>PosterTrace</LogoTitle>
      </LogoWrapper>
  );
}


const LogoWrapper = styled(Link)`
  display: flex;
  flex-direction: row;
  align-items: center;

  gap: 8px;
  width: fit-content;
  
  color: var(--color-green-800);
  text-decoration: none;
`

const LogoTitle = styled.p`
  font-size: ${32/16}rem;
  line-height: ${32/16}rem;
  font-weight: bold;
  font-family: var(--font-nunito), sans-serif;
  
  @media ${QUERIES.phoneAndDown} {
    display:none;
  }
`