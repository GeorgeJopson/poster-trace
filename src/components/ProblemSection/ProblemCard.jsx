import styled from "styled-components";

import React from "react";
import {ELEVATIONS} from "@/constants";

export default function ProblemCard({icon, title, children}) {
  return (
    <ProblemCardWrapper>
      <ProblemCardIcon>
        {icon}
      </ProblemCardIcon>
      <div>
        <ProblemCardTitle>{title}:</ProblemCardTitle>
        <ProblemCardContent>{children}</ProblemCardContent>
      </div>
    </ProblemCardWrapper>
  );
}

const ProblemCardWrapper = styled.div`
  flex:1;
  min-width: 26ch;
  max-width: 50ch;
  position: relative;
  background-color: white;
  border-radius: 8px;
  border: 1px solid var(--color-green-950);
  color: var(--color-green-950);
  padding: 12px 12px 12px 72px;

  --shadow-color: var(--color-green-800-fragment);
  box-shadow: ${ELEVATIONS.small};
  
  display: flex;
  justify-content: center;
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
  max-width: 32ch;
`