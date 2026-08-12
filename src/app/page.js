import styled from "styled-components";

import { Aperture } from 'feather-icons-react';

export default function Home() {
  return (
    <main>
      <NavBar>
        <Aperture size={28} strokeWidth={"1.5px"}/>
        <p>PosterTrace</p>
      </NavBar>
      <HeroWrapper>
      </HeroWrapper>

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
const NavBar = styled.div`
  border-radius: 8px;
  padding: 0 4px;
  gap: 8px;
  position: fixed;
  top: 16px;
  left: 64px;
  right: 64px;
  font-size: calc(32 / 16 * 1rem);
  font-weight:900;
  font-family: var(--font-dm-sans),sans-serif;
  
  background-image: linear-gradient(
          to left,
          var(--color-orange-300-transparent) 0%,
          var(--color-orange-200-transparent) 100%
  );
  display: flex;
  flex-direction: row;
  align-items: center;

`