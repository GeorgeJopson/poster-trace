"use client";

import { useState } from "react";
import { animated } from "react-spring";

import Button from "@/components/Button";
import Dialog from "@/components/Dialog";
import useBoop from "@/utils/useBoop";

import styles from "./CreatePosterDesignDialog.module.css";

export default function CreatePosterDesignDialog() {
  const [open, setOpen] = useState(false);
  const [style, trigger] = useBoop({ rotation: 10 });

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title="Create new poster design"
      trigger={
        <button className={styles.newDesignButton} onMouseEnter={trigger}>
          <span className={styles.newDesignText}>New Poster Design</span>
          <animated.span style={style} className={styles.plus}>
            +
          </animated.span>
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
