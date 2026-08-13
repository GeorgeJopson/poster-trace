import styled from "styled-components";

import NavBar from "@/components/NavBar";
import Hero from "@/components/Hero";

import React from "react";
import TheProblemMarketingSection from "@/components/TheProblemMarketingSection";

export default function Home() {
  return (
    <main>
      <NavBar/>
      <ContentGroup>
        <Hero/>
        <TheProblemMarketingSection/>
      </ContentGroup>
      <Spacer/>
    </main>
  );
}

const ContentGroup = styled.div`
  background-color: var(--color-orange-50);
`

const Spacer = styled.div`
  height: 300vh;
`