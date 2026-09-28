"use client";

import { useState } from "react";

import Button from "@/components/Button";
import Dialog from "@/components/Dialog";
import NewItemButton from "@/components/NewItemButton";

import styles from "./CreatePosterDesignDialog.module.css";

export default function CreatePosterDesignDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title="Create new poster design"
      trigger={
        <NewItemButton
          label="New Poster Design"
          className={styles.newDesignButton}
        />
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
