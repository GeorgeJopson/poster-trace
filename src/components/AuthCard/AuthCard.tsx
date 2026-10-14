import React from "react";

import CentralColumn from "@/components/CentralColumn";
import Header from "@/components/Header";

import styles from "./AuthCard.module.css";

interface AuthCardProps {
  heading: string;
  children: React.ReactNode;
}

// The centred card shared by the log-in, sign-up and password reset pages.
export default function AuthCard({ heading, children }: AuthCardProps) {
  return (
    <CentralColumn>
      <div className={styles.wrapper}>
        <div className={styles.card}>
          <Header variant={"heading"}>{heading}</Header>

          {children}
        </div>
      </div>
    </CentralColumn>
  );
}
