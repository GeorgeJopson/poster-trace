import styled from "styled-components";

import NavBar from "@/components/NavBar";
import Hero from "@/components/Hero";

import React from "react";
import TheProblemMarketingSection from "@/components/TheProblemMarketingSection";
import ContentGroup from "@/components/ContentGroup";
import TheSolutionMarketingSection from "@/components/TheSolutionMarketingSection";
import Section1 from "@/components/Section1";

export default function Home() {
  return (
    <main>
      <Section1></Section1>
      <NavBar/>
    </main>
  );
}

const Spacer = styled.div`
  height: 300vh;
`