import React from 'react';
import Button from "@/components/Button";

import {QUERIES} from "@/constants";
import styled from "styled-components";
import Image from "next/image";

const scaleFactor = 0.65;

export default function HeaderButtonGroup() {
  return (
      <ButtonWrapper>
        <Button type={"filled"} fontSize={`var(--signup-btn-size)`}>Sign Up</Button>
        <Button type={"transparent"} fontSize={`var(--learn-more-btn-size)`}>Learn More <InlineImage width={32} height={32} src={"/arrow-right.svg"} alt={"right arrow"}/></Button>
      </ButtonWrapper>
  );
}

const InlineImage = styled(Image)`
  display: inline-block;
  
  --image-size: ${32/16}rem;
  width: var(--image-size);
  height: var(--image-size);
  @media ${QUERIES.phoneAndDown}{
    --image-size: ${32/16*scaleFactor}rem;
  }

`

const ButtonWrapper = styled.div`
  margin: 8px 0;

  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: left;
  
  gap: 24px;
  row-gap: 4px;
  --signup-btn-size: ${36/16}rem;
  --learn-more-btn-size: ${32/16}rem;

  @media ${QUERIES.phoneAndDown}{
    gap: 16px;
    --signup-btn-size: ${36/16 * scaleFactor}rem;
    --learn-more-btn-size: ${32/16 * scaleFactor}rem;
  }
  
`