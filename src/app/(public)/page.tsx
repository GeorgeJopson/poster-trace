import React from "react";
import SolutionSection from "@/app/(public)/_components/SolutionSection";
import AnalyticsSection from "@/app/(public)/_components/AnalyticsSection";
import CallToAction from "@/app/(public)/_components/CallToAction";
import ProblemSection from "@/app/(public)/_components/ProblemSection";
import Hero from "@/app/(public)/_components/Hero";

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
