import React from 'react';
import ContentGroup from "@/components/ContentGroup";
import styled from "styled-components";
import CentralColumn from "@/components/CentralColumn";
import Title from "@/components/Section1/Title";

function Section1() {
  return (
    <Wrapper>
      <CentralColumn>
        <Title>
          Poster&nbsp;Analytics,<br/>
          For&nbsp;Communities,<br/>
          For&nbsp;Free.
        </Title>
      </CentralColumn>
    </Wrapper>

  );
}

export default Section1;

const Wrapper = styled(ContentGroup)`
  padding-top: calc(48px);
`