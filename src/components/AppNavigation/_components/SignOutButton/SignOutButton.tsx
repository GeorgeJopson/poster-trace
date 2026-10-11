"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/auth/auth-client";

import styles from "./SignOutButton.module.css";

export default function SignOutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      await authClient.signOut();
      router.push("/");
      router.refresh();
    });
  }

  return (
    <button
      className={styles.signOutButton}
      type="button"
      onClick={handleClick}
      disabled={isPending}
    >
      Sign Out
    </button>
  );
}
