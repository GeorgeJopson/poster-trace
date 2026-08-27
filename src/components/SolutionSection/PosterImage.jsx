import styled from "styled-components";

import React from "react";
import Image from "next/image";
import {ELEVATIONS, QUERIES} from "@/constants";

export default function PosterImage({desktopOnly, image, width, height, posX, posY, tilt}) {
  return (
    <ImageWrapper $desktopOnly={desktopOnly} $width={width} $posX={posX} $posY={posY} $tilt={tilt}>
      <Image loading="lazy" src={image} width={width} height={height} alt={"Picture of Posters"}/>
      <Tint/>
    </ImageWrapper>
  );
}

const ImageWrapper = styled.div`
  overflow:clip;
  border-radius: 8px;
  
  width: ${({$width})=>$width}px;

  position: absolute;
  top: ${({$posY})=>$posY};
  left: ${({$posX})=>$posX};

  --shadow-color: var(--color-orange-300-fragment);
  box-shadow: ${ELEVATIONS.medium};
  
  translate: -50%;
  rotate: ${({$tilt})=>$tilt}deg;
  transition: rotate 0.5s;
  
  &:hover {
    rotate: ${({$tilt})=>$tilt+Math.sign($tilt)*2}deg;
  }
  
  @media ${QUERIES.tabletAndDown} {
    display: ${({$desktopOnly})=>$desktopOnly ? "none" : "block"};
  }
`

const Tint = styled.div`
  width: 100%;
  height: 100%;
  background-color: var(--color-orange-50);
  opacity:0.1;
  position: absolute;
  top:0;
  left:0;
`