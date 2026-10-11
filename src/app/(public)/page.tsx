import React from "react";
import SolutionSection from "@/app/_components/SolutionSection";
import AnalyticsSection from "@/app/_components/AnalyticsSection";
import CallToAction from "@/app/_components/CallToAction";
import ProblemSection from "@/app/_components/ProblemSection";
import Hero from "@/app/_components/Hero";

export default function Home() {
  return (
    <>
      <Hero />
      <ProblemSection />
      <SolutionSection />
      <AnalyticsSection />
      <CallToAction />
    </>
  );
}
