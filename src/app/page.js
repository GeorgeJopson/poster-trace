import styled from "styled-components";

import NavBar from "@/components/NavBar";
import Hero from "@/components/Hero";

import React from "react";
import TheProblemMarketingSection from "@/components/TheProblemMarketingSection";
import ContentGroup from "@/components/ContentGroup";
import TheSolutionMarketingSection from "@/components/TheSolutionMarketingSection";

export default function Home() {
  return (
    <main>
      <Spacer/>
      <NavBar/>
    </main>
  );
}

const Spacer = styled.div`
  height: 300vh;
`