"use client";

import React, { useRef, useState } from "react";

import Button from "@/components/Button";
import Dialog from "@/components/Dialog";
import NewItemButton from "@/components/NewItemButton";

import styles from "./CreatePosterDesignDialog.module.css";
import PosterDesignFields, { QrValues } from "./PosterDesignFields";
import useDrawCanvas from "./useDrawCanvas";

const DEFAULT_QR_VALUES: QrValues = {
  qrXPosition: "0",
  qrYPosition: "0",
  qrSize: "0",
  qrRotation: "0",
};

function logQrValues(values: QrValues) {
  console.log({
    qr_x_position: parseFloat(values.qrXPosition),
    qr_y_position: parseFloat(values.qrYPosition),
    qr_size: parseFloat(values.qrSize),
    qr_rotation: parseFloat(values.qrRotation),
  });
}

export default function CreatePosterDesignDialog() {
  const [open, setOpen] = useState(false);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [qrValues, setQrValues] = useState<QrValues>(DEFAULT_QR_VALUES);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawCanvas = useDrawCanvas(canvasRef, image);

  // The dialog content (including the file input and canvas) is recreated each
  // time it opens, so reset the state to match.
  function handleOpenChange(nextOpen: boolean) {
    setImage(null);
    setQrValues(DEFAULT_QR_VALUES);
    setOpen(nextOpen);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setImage(null);
      drawCanvas();
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      setImage(img);
      drawCanvas(img);
    };
    img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;
  }

  function handleQrChange(key: keyof QrValues, value: string) {
    const next = { ...qrValues, [key]: value };
    setQrValues(next);
    logQrValues(next);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
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
        <PosterDesignFields
          qrValues={qrValues}
          onFileChange={handleFileChange}
          onQrChange={handleQrChange}
        />

        <canvas ref={canvasRef} className={styles.canvas} hidden={!image} />

        <div className={styles.submitButtonWrapper}>
          <Button variant={"filled"} fontSize={"1.5rem"} type="submit">
            Create poster design
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
