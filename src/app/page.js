import NavBar from "@/components/NavBar";

import React from "react";
import Hero from "@/components/Hero";
import styled from "styled-components";
import ProblemSection from "@/components/ProblemSection";

export default function Home() {
  return (
    <main>
      <Hero/>
      <ProblemSection/>
      <Spacer/>
      <NavBar/>
    </main>
  );
}

const Spacer = styled.div`
  height: 100vh;
`