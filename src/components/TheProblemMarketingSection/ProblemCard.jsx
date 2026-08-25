import styled from "styled-components";

import React from "react";
import {ELEVATIONS} from "@/constants";

export default function ProblemCard({icon, title, children}) {
  return (
    <ProblemCardWrapper>
      <ProblemCardIcon>
        {icon}
      </ProblemCardIcon>
      <ProblemCardTitle>{title}:</ProblemCardTitle>
      <ProblemCardContent>{children}</ProblemCardContent>
    </ProblemCardWrapper>
  );
}

const ProblemCardWrapper = styled.div`
  position: relative;
  background-color: white;
  border-radius: 8px;
  border: 1px solid var(--color-orange-900);
  padding: 12px 12px 12px 72px;

  --shadow-color: var(--color-orange-300-fragment);
  box-shadow: ${ELEVATIONS.medium};
`
const ProblemCardIcon = styled.div`
  position: absolute;
  top: 16px;
  left: 4px;
`

const ProblemCardTitle = styled.h3`
  font-size: ${20 / 16}rem;
  font-weight: bold;
`

const ProblemCardContent = styled.p`
  font-size: ${16 / 16}rem;
  max-width: 260px;
`