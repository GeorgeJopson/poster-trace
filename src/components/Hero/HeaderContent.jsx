import React from 'react';
import HeaderButtonGroup from "@/components/Hero/HeaderButtonGroup";
import Header from "@/components/Header";
import styles from "./HeaderContent.module.css";


export default function HeaderContent() {
  return (
    <div>
      <Header type={"title"}>
        Poster&nbsp;Analytics,<br/>
        For&nbsp;Communities,<br/>
        For&nbsp;Free.
      </Header>
      <div className={styles.introduction}>
        <p>Revolutionise your poster campaigns, by finally getting the data you need.</p>
        <p>Generate posters, log their locations as you put them up, and let the analytics roll in.</p>
        <HeaderButtonGroup/>
      </div>
    </div>
  );
}
