'use client';
import React from 'react';
import styled from "styled-components";

function useShimmerCleanUp(shimmer, setShimmer) {
  React.useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setShimmer([]);
    }, 1000+200);

    return () => {
      window.clearTimeout(timeoutId);
    }
  }, [shimmer, setShimmer]);

}

export default function SignUpNowBtn() {
  const [shimmers, setShimmers] = React.useState([]);
  useShimmerCleanUp(shimmers, setShimmers);
  function addShimmer() {
    setShimmers([...shimmers,<Shimmer key={crypto.randomUUID()}/>]);
  }

  return (
    <Btn onMouseEnter={()=>addShimmer()}>
      {shimmers}
      Sign Up Now
    </Btn>
  )
}

const Shimmer = styled.span`
  @keyframes shimmer {
    from {
      transform: translateX(-100%);
    }
    to {
      transform: translateX(100%);
    }
  }
  
  position: absolute;
  inset: 0;
  height: 100%;
  width: 100%;
  background: linear-gradient(
          to right,
          transparent,
          hsl(142deg 100% 90%),
          transparent
  );
  opacity: 0.5;
  animation: shimmer forwards 1000ms;
`

const Btn = styled.button`
  position: relative;
  overflow: hidden;
  border-radius: 8px;

  padding: 0 8px;

  text-wrap: nowrap;
  
  border: none;

  display: flex;
  align-items: center;
  
  background-color: var(--color-green-900);
  color: white;
  
  font-family: var(--font-bungee),sans-serif;
  font-size: ${64/16}rem;
  
  outline: var(--color-green-900) 4px solid;
  outline-offset: 8px;
  
  transition: outline-offset 0.1s ease-in-out;
  &:hover {
    outline-offset: 4px;
  }
`