"use client";

import React, { useRef, useState, useTransition } from "react";

import Button from "@/components/Button";
import Dialog from "@/components/Dialog";
import NewItemButton from "@/components/NewItemButton";
import { getImageFileError } from "@/data/posterDesignValidation";
import usePosterCanvas from "@/utils/usePosterCanvas";
import { createPosterDesign } from "../../actions";
import { useCampaignId, useCampaignTarget } from "../CampaignContext";

import styles from "./CreatePosterDesignDialog.module.css";
import PosterDesignFields, { type QrValues } from "./PosterDesignFields";

const DEFAULT_QR_VALUES: QrValues = {
  qrXPosition: "0",
  qrYPosition: "0",
  qrSize: "0",
  qrRotation: "0",
};

export default function CreatePosterDesignDialog() {
  const campaignId = useCampaignId();
  const target = useCampaignTarget();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [qrValues, setQrValues] = useState<QrValues>(DEFAULT_QR_VALUES);
  const maxQrSize = image
    ? Math.min(image.naturalWidth, image.naturalHeight)
    : 0;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  usePosterCanvas(
    canvasRef,
    image,
    {
      qrXPosition: parseFloat(qrValues.qrXPosition) || 0,
      qrYPosition: parseFloat(qrValues.qrYPosition) || 0,
      qrSize: parseFloat(qrValues.qrSize) || 0,
      qrRotation: parseFloat(qrValues.qrRotation) || 0,
    },
    target,
  );

  // The dialog content (including the file input and canvas) is recreated each
  // time it opens, so reset the state to match.
  function handleOpenChange(nextOpen: boolean) {
    setImage(null);
    setQrValues(DEFAULT_QR_VALUES);
    setOpen(nextOpen);
  }

  function clearImage() {
    setImage(null);
    setQrValues(DEFAULT_QR_VALUES);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    const file = input.files?.[0];
    input.setCustomValidity("");
    if (!file) {
      clearImage();
      return;
    }

    // Reject invalid files by marking the input invalid, which blocks the form
    // from submitting and shows the browser's validation message.
    function rejectFile(message: string) {
      input.setCustomValidity(message);
      input.reportValidity();
      clearImage();
    }
    const fileError = getImageFileError(file);
    if (fileError) {
      rejectFile(fileError);
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      setImage(img);
      setQrValues(DEFAULT_QR_VALUES);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      rejectFile("This image couldn't be read. Please choose another file.");
    };
    img.src = url;
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await createPosterDesign(campaignId, formData);
      setOpen(false);
    });
  }

  function handleQrChange(key: keyof QrValues, value: string) {
    setQrValues((current) => ({ ...current, [key]: value }));
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
      <form className={styles.form} action={handleSubmit}>
        <PosterDesignFields
          qrValues={qrValues}
          maxQrSize={maxQrSize}
          onFileChange={handleFileChange}
          onQrChange={handleQrChange}
        />

        <canvas ref={canvasRef} className={styles.canvas} hidden={!image} />

        <div className={styles.submitButtonWrapper}>
          <Button
            variant={"filled"}
            fontSize={"1.5rem"}
            type="submit"
            disabled={isPending}
          >
            Create poster design
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
