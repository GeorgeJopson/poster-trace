"use client";

import React, { useRef, useState, useTransition } from "react";

import type { QrPlacementDto } from "@application/dto/PosterDesignDto";
import { validatePosterDesignImage } from "@application/validation/validatePosterDesignImage";
import Button from "@/components/Button";
import CentralDialog from "@/components/CentralDialog";
import NewItemButton from "@/components/NewItemButton";
import loadDesignImage, {
  type DesignImage,
} from "@/utils/poster-render/loadDesignImage";
import usePosterCanvas from "@/utils/poster-render/usePosterCanvas";
import { createPosterDesign } from "../../actions";
import { useCampaignId, useSampleScanUrl } from "../CampaignContext";

import styles from "./CreatePosterDesignDialog.module.css";
import PosterDesignFields, { type SliderField } from "./PosterDesignFields";
import {
  DEFAULT_QR_PLACEMENT,
  dragQrCode,
  grabQrCode,
  nudgeQrCode,
  type Grab,
  type ImagePoint,
  type NudgeDirection,
} from "./qrPlacementEditing";
import QrPositionControls from "./QrPositionControls";

const ARROW_KEYS: Record<string, NudgeDirection> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

/** Where a pointer event is on the preview, which shows the whole image. */
function pointOnImage(
  event: React.PointerEvent<HTMLCanvasElement>,
): ImagePoint {
  const box = event.currentTarget.getBoundingClientRect();
  return {
    x: ((event.clientX - box.left) / box.width) * 100,
    y: ((event.clientY - box.top) / box.height) * 100,
  };
}

export default function CreatePosterDesignDialog() {
  const campaignId = useCampaignId();
  const sampleScanUrl = useSampleScanUrl();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [image, setImage] = useState<DesignImage | null>(null);
  const [qrPlacement, setQrPlacement] =
    useState<QrPlacementDto>(DEFAULT_QR_PLACEMENT);
  // Where the QR code was grabbed, while it's being dragged.
  const grabRef = useRef<Grab | null>(null);
  // Counts picked files, so a slow check or load of an earlier file is ignored.
  const filePickCountRef = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  usePosterCanvas(canvasRef, image, qrPlacement, sampleScanUrl);

  // The dialog content (including the file input and canvas) is recreated each
  // time it opens, so reset the state to match.
  function handleOpenChange(nextOpen: boolean) {
    setImage(null);
    setQrPlacement(DEFAULT_QR_PLACEMENT);
    setOpen(nextOpen);
  }

  function clearImage() {
    setImage(null);
    setQrPlacement(DEFAULT_QR_PLACEMENT);
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    const file = input.files?.[0];
    const pick = ++filePickCountRef.current;
    const isLatestPick = () => pick === filePickCountRef.current;
    input.setCustomValidity("");
    clearImage();
    if (!file) return;

    // Reject invalid files by marking the input invalid, which blocks the form
    // from submitting and shows the browser's validation message.
    function rejectFile(message: string) {
      if (!isLatestPick()) return;
      input.setCustomValidity(message);
      input.reportValidity();
      clearImage();
    }

    const check = await validatePosterDesignImage(file);
    if (check.error !== null) {
      rejectFile(check.error);
      return;
    }

    try {
      // Loaded as its real format, which the file's own type may not be.
      const loaded = await loadDesignImage(
        file.slice(0, file.size, check.contentType),
      );
      if (!isLatestPick()) return;
      setImage(loaded);
      setQrPlacement(DEFAULT_QR_PLACEMENT);
    } catch {
      rejectFile("This PDF couldn't be read. Please choose another file.");
    }
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await createPosterDesign(campaignId, formData);
      setOpen(false);
    });
  }

  function handleQrChange(key: SliderField, value: number) {
    setQrPlacement((current) => ({ ...current, [key]: value }));
  }

  function handleNudge(direction: NudgeDirection) {
    setQrPlacement((current) => nudgeQrCode(current, direction));
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLCanvasElement>) {
    const direction = ARROW_KEYS[event.key];
    // Only the plain arrow keys are bound.
    const modified =
      event.shiftKey || event.ctrlKey || event.altKey || event.metaKey;
    if (!direction || modified) return;
    // Arrow keys would otherwise scroll.
    event.preventDefault();
    handleNudge(direction);
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    // Only a main-button press, or the first touch, drags.
    if (!image || !event.isPrimary || event.button !== 0) return;
    const grab = grabQrCode(pointOnImage(event), qrPlacement, image);
    if (!grab) return;
    // Captured, so the drag carries on when the pointer leaves the preview.
    event.currentTarget.setPointerCapture(event.pointerId);
    grabRef.current = grab;
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    const grab = grabRef.current;
    if (!grab) return;
    const position = dragQrCode(pointOnImage(event), grab);
    setQrPlacement((current) => ({ ...current, ...position }));
  }

  function endDrag() {
    grabRef.current = null;
  }

  return (
    <CentralDialog
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
          qrPlacement={qrPlacement}
          hasImage={image !== null}
          onFileChange={handleFileChange}
          onQrChange={handleQrChange}
        />

        <canvas
          ref={canvasRef}
          className={styles.canvas}
          hidden={!image}
          // An application, so screen readers pass its arrow keys through.
          role="application"
          aria-label="QR code position"
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onLostPointerCapture={endDrag}
        />

        <QrPositionControls
          qrPlacement={qrPlacement}
          hasImage={image !== null}
          onNudge={handleNudge}
          onReset={() => setQrPlacement(DEFAULT_QR_PLACEMENT)}
        />

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
    </CentralDialog>
  );
}
