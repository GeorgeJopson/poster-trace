import NavBar from "@/components/NavBar";

import React from "react";
import Hero from "@/app/_components/Hero";
import ProblemSection from "@/app/_components/ProblemSection";
import SolutionSection from "@/app/_components/SolutionSection";
import AnalyticsSection from "@/app/_components/AnalyticsSection";
import CallToAction from "@/app/_components/CallToAction";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <NavBar/>
      <main>
        <Hero/>
        <ProblemSection/>
        <SolutionSection/>
        <AnalyticsSection/>
        <CallToAction/>
      </main>
      <Footer/>
    </>
  );
}