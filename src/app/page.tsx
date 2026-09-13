import React from "react";
import SolutionSection from "@/app/_components/SolutionSection";
import AnalyticsSection from "@/app/_components/AnalyticsSection";
import CallToAction from "@/app/_components/CallToAction";
import HeroAndProblemSection from "@/app/_components/HeroAndProblemSection";

export default function Home() {
  return (
    <>
        <HeroAndProblemSection/>
        <SolutionSection/>
        <AnalyticsSection/>
        <CallToAction/>
    </>
  );
}