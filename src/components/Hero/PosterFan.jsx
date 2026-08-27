import React from 'react';
import styled from "styled-components";
import {QUERIES} from "@/constants";
import Image from "next/image";
import {posterSize, posterWrapperDefaults} from "@/components/Hero/PosterWrapperConstants";
import {stockPoster1, stockPoster2, stockPoster3} from "../../../public/poster-images/imageDetails";

const imageSmallerScale = 0.8;
const imageSizes = `${QUERIES.laptopAndDown} ${posterSize*imageSmallerScale}px, ${posterSize}px`;

export default function PosterFan() {
  return (
    <>
      <PosterThree>
        <Image
          src={stockPoster3.src}
          alt={stockPoster3.alt}
          fill
          sizes={imageSizes}
        />
      </PosterThree>

      <PosterTwo>
        <Image
          src={stockPoster2.src}
          alt={stockPoster2.alt}
          fill
          sizes={imageSizes}
        />
      </PosterTwo>

      <PosterOne>
        <Image
          src={stockPoster1.src}
          alt={stockPoster1.alt}
          fill
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