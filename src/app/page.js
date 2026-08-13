import styled from "styled-components";

import NavBar from "@/components/NavBar";
import Hero from "@/components/Hero";

export default function Home() {
  return (
    <main>
      <NavBar/>
      <Hero/>
      <Spacer/>
    </main>
  );
}

const Spacer = styled.div`
  height: 300vh;
`