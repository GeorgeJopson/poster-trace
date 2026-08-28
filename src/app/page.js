import NavBar from "@/components/NavBar";

import React from "react";
import Hero from "@/components/Hero";
import ProblemSection from "@/components/ProblemSection";
import SolutionSection from "@/components/SolutionSection";
import AnalyticsSection from "@/components/AnalyticsSection";
import CallToAction from "@/components/CallToAction";

export default function Home() {
  return (
    <main>
      <Hero/>
      <ProblemSection/>
      <SolutionSection/>
      <AnalyticsSection/>
      <CallToAction/>
      <NavBar/>
    </main>
  );
}