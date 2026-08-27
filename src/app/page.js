import NavBar from "@/components/NavBar";

import React from "react";
import Hero from "@/components/Hero";
import styled from "styled-components";
import ProblemSection from "@/components/ProblemSection";
import SolutionSection from "@/components/SolutionSection";

export default function Home() {
  return (
    <main>
      <Hero/>
      <ProblemSection/>
      <SolutionSection/>
      <Spacer/>
      <NavBar/>
    </main>
  );
}

const Spacer = styled.div`
  height: 100vh;
`