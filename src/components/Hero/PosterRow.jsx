import React from 'react';
import styled from "styled-components";
import {QUERIES} from "@/constants";
import Image from "next/image";
import {posterSize, posterWrapperDefaults} from "@/components/Hero/PosterWrapperConstants";
import {stockPoster2, stockPoster3, stockPoster4} from "../../../public/poster-images/imageDetails";

const imageLargeScale = 0.45;
const imageMediumScale = 0.4;
const imageSmallScale = 0.35;

const imageSizes = `
  ${QUERIES.smallPhoneAndDown} ${posterSize*imageSmallScale}px,
  ${QUERIES.phoneAndDown} ${posterSize*imageMediumScale}px,
  ${posterSize*imageLargeScale}px
 `;


export default function PosterRow() {
  return (
    <Wrapper>
      <Poster1>
        <Image
          src={stockPoster2.src}
          alt={stockPoster2.alt}
          fill
          sizes={imageSizes}
        />
      </Poster1>
      <Poster2>
        <Image
          src={stockPoster3.src}
          alt={stockPoster3.alt}
          fill
          sizes={imageSizes}
        />
      </Poster2>
      <Poster3>
        <Image
          src={stockPoster4.src}
          alt={stockPoster4.alt}
          fill
          sizes={imageSizes}
        />
      </Poster3>
    </Wrapper>

  );
}

const Wrapper = styled.div`
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