import React from 'react';
import Header from "@/components/Header";
import CentralColumn from "@/components/CentralColumn";
import ProblemCard from "@/app/_components/ProblemSection/ProblemCard";
import Image from "next/image";
import { icons } from "@/imageDetails";
import styles from "./ProblemSection.module.css";

export default function ProblemSection() {
  return (
    <section className={styles.wrapper} aria-label="The problem">
      <CentralColumn>
        <Header variant="heading">The Problem</Header>
        <ul className={styles.problemCardGroup}>
          <ProblemCard icon={<Image width={64} height={64} src={icons.clipboard.src} alt={icons.clipboard.alt}/>} title={"No Information"}>You have no idea where your posters are actually working, and where people are just walking past.</ProblemCard>
          <ProblemCard icon={<Image width={64} height={64} src={icons.map.src} alt={icons.map.alt}/>} title={"No Record"}>If you find a great spot, you have no way of remembering where it is for your next poster campaign.</ProblemCard>
          <ProblemCard icon={<Image width={64} height={64} src={icons.database.src} alt={icons.database.alt}/>} title={"No System"}>All your marketing information is spread across countless docs and websites.</ProblemCard>
        </ul>
      </CentralColumn>
    </section>
  );
}
