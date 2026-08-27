import React from 'react';
import styled from "styled-components";
import {QUERIES} from "@/constants";
import Image from "next/image";
import {posterWrapperDefaults} from "@/components/Hero/PosterWrapperConstants";

export default function PosterRow() {
  return (
    <Wrapper>
      <Poster1>
        <Image
          src={"/poster-images/stock-poster-2.png"}
          alt={
            "Poster Advertising Upcoming Events like a Grand Opening and Creative Gathering. " +
            "There is a QR code in the bottom right hand corner."}
          fill
        />
      </Poster1>
      <Poster2>
        <Image
          src={"/poster-images/stock-poster-3.png"}
          alt={
            "Poster Advertising Upcoming Events like a Grand Opening and Creative Gathering. " +
            "There is a QR code in the bottom right hand corner."}
          fill
        />
      </Poster2>
      <Poster3>
        <Image
          src={"/poster-images/stock-poster-4.png"}
          alt={
            "Poster Advertising Upcoming Events like a Grand Opening and Creative Gathering. " +
            "There is a QR code in the bottom right hand corner."}
          fill
        />
      </Poster3>
    </Wrapper>

  );
}

const Wrapper = styled.div`
  padding: 16px 0;
  display: flex;
  flex-direction: row;
  justify-content: space-around;
`

const PosterWrapper = styled.div`
  ${posterWrapperDefaults};
  
  --scale-factor: 0.45;
  @media ${QUERIES.phoneAndDown} {
    --scale-factor: 0.4;
  }
  @media ${QUERIES.smallPhoneAndDown} {
    --scale-factor: 0.35;
  }
`

const Poster1 = styled(PosterWrapper)`
  rotate: -8deg;
`
const Poster2 = styled(PosterWrapper)`
  rotate: 4deg;
`
const Poster3 = styled(PosterWrapper)`
  rotate: -6deg;
`