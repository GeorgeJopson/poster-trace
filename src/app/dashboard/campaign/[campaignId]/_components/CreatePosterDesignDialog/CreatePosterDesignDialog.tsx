"use client";

import { useState } from "react";

import Button from "@/components/Button";
import Dialog from "@/components/Dialog";

import styles from "./CreatePosterDesignDialog.module.css";

export default function CreatePosterDesignDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title="Create new poster design"
      trigger={
        <button className={styles.newDesignButton}>
          <span className={styles.newDesignText}>New Poster Design</span>
          <span className={styles.plus}>+</span>
        </button>
      }
    >
      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          setOpen(false);
        }}
      >
        <div className={styles.fields} />

        <div className={styles.submitButtonWrapper}>
          <Button variant={"filled"} fontSize={"1.5rem"} type="submit">
            Create poster design
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
