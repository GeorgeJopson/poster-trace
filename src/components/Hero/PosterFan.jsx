import React from 'react';
import styled from "styled-components";
import {QUERIES} from "@/constants";
import Image from "next/image";
import {posterSize, posterWrapperDefaults} from "@/components/Hero/PosterWrapperConstants";

const imageSmallerScale = 0.8;
const imageSizes = `${QUERIES.laptopAndDown} ${posterSize*imageSmallerScale}px, ${posterSize}px`;

export default function PosterFan() {
  return (
    <>
      <PosterThree>
        <Image
          src={"/poster-images/stock-poster-3.png"}
          alt={
            "Poster Advertising Upcoming Events like a Grand Opening and Creative Gathering. " +
            "There is a QR code in the bottom right hand corner."}
          fill
          sizes={imageSizes}
        />
      </PosterThree>

      <PosterTwo>
        <Image
          fill
          src={"/poster-images/stock-poster-2.png"}
          alt={
            "Poster Advertising Upcoming Events like a Grand Opening and Creative Gathering. " +
            "There is a QR code in the bottom right hand corner."}
          sizes={imageSizes}
        />
      </PosterTwo>

      <PosterOne>
        <Image
          fill
          src={"/poster-images/stock-poster-1.png"}
          alt={
            "Poster Advertising Upcoming Events like a Grand Opening and Creative Gathering. " +
            "There is a QR code in the bottom right hand corner."}
          sizes={imageSizes}
        />
      </PosterOne>
    </>
  );
}

const PosterWrapper = styled.div`
  ${posterWrapperDefaults};
  position: absolute;

  --scale-factor: 1;
  @media ${QUERIES.laptopAndDown} {
    --scale-factor: ${imageSmallerScale};
  }
`

const PosterWrapperForLargeScreens = styled(PosterWrapper)`
  @media ${QUERIES.tabletAndDown} {
    display: none;
  }
`

const PosterOne = styled(PosterWrapper)`
  top: 16px;
  left: 60%;
  rotate: 4deg;
  transform: translateX(-50%);
  @media ${QUERIES.tabletAndDown} {
    top: 50%;
    transform: translate(-50%, -50%);
  }
`

const PosterTwo = styled(PosterWrapperForLargeScreens)`
  top: 160px;
  left: 60%;
  rotate: 16deg;
  transform: translateX(calc(-50% + min(128px, 15vw - 100px)));
`

const PosterThree = styled(PosterWrapperForLargeScreens)`
  top: 32px;
  left: 60%;
  rotate: -8deg;
  transform: translateX(calc(-50% - min(128px, 15vw - 100px)));
`