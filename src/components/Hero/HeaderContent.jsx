import React from 'react';
import HeaderButtonGroup from "@/components/Hero/HeaderButtonGroup";
import Header from "@/components/Header";
import styles from "./HeaderContent.module.css";


export default function HeaderContent() {
  return (
    <div className={styles.wrapper}>
      <Header type={"title"}>
        Poster Analytics,<br/>
        For Communities,<br/>
        For Free.
      </Header>
      <div className={styles.introduction}>
        <p>Revolutionise your poster campaigns, by finally getting the data you need.</p>
        <p>Generate posters, log their locations as you put them up, and let the analytics roll in.</p>
        <HeaderButtonGroup/>
      </div>
    </div>
  );
}
