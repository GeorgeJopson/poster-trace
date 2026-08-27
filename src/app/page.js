import NavBar from "@/components/NavBar";

import React from "react";
import Hero from "@/components/Hero";
import styled from "styled-components";

export default function Home() {
  return (
    <main>
      <Hero/>
      <Spacer/>
      <NavBar/>
    </main>
  );
}

const Spacer = styled.div`
  height: 100vh;
`