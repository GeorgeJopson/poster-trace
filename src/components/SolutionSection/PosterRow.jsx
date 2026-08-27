import React from 'react';
import styled from "styled-components";
import {QUERIES} from "@/constants";
import Image from "next/image";
import {posterSize, posterWrapperDefaults} from "@/components/Hero/PosterWrapperConstants";
import {stockPoster2, stockPoster3, stockPoster4} from "../../../public/imageDetails";

const imageScaleDefault = 0.8;
const imageScaleLaptop = 0.65;
const imageScaleTablet = 0.55;
const imageScale475 = 0.4;
const imageScale435 = 0.3;

const imageSizes = `
  (max-width: ${435 / 16}rem) ${posterSize * imageScale435}px,
  (max-width: ${475 / 16}rem) ${posterSize * imageScale475}px,
  ${QUERIES.tabletAndDown} ${posterSize * imageScaleTablet}px,
  ${QUERIES.laptopAndDown} ${posterSize * imageScaleLaptop}px,
  ${posterSize * imageScaleDefault}px
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
  align-items: center;
  height: 100%;
  
  flex-wrap: wrap;
  row-gap: 0;
`

const PosterWrapper = styled.div`
  ${posterWrapperDefaults};
  
  --scale-factor: ${imageScaleDefault};
  
  @media ${QUERIES.laptopAndDown} {
    --scale-factor: ${imageScaleLaptop};
  }
  @media ${QUERIES.tabletAndDown} {
    --scale-factor: ${imageScaleTablet};
  }
  @media (max-width: ${475/16}rem) {
    --scale-factor: ${imageScale475};
  }
  @media (max-width: ${435/16}rem) {
    --scale-factor: ${imageScale435};
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