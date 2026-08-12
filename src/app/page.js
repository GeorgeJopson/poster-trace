import styled from "styled-components";

import NavBar from "@/components/NavBar";

export default function Home() {
  return (
    <main>
      <NavBar/>
      <HeroWrapper></HeroWrapper>
      <Spacer/>
    </main>
  );
}

const Spacer = styled.div`
  height: 300vh;
`

const HeroWrapper = styled.div`
  height: 100px;
  border-radius: 0 0 var(--spacing-10) var(--spacing-10);

  background-image: linear-gradient(
          135deg,
          var(--color-orange-300) 0%,
          var(--color-orange-500) 100%
  );
  padding: 0 64px;
`