"use client";

import React, { useRef } from "react";
import Hero from "@/app/_components/Hero";
import ProblemSection from "@/app/_components/ProblemSection";

// We use a component wrapping this so only the Hero and ProblemSection have to
// become client components.
export default function HeroAndProblemSection() {
  const scrollToRef = useRef<HTMLElement>(null);
  return (
    <>
      <Hero scrollToRef={scrollToRef} />
      <ProblemSection scrollToRef={scrollToRef} />
    </>
  );
}
