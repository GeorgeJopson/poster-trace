import React, { useLayoutEffect, useRef } from "react";

import type { QrPlacementDto } from "@application/dto/PosterDesignDto";
import Button from "@/components/Button";
import IconButton from "@/components/IconButton";
import { icons } from "@/imageDetails";

import {
  canNudgeQrCode,
  isDefaultQrPlacement,
  type NudgeDirection,
} from "./qrPlacementEditing";
import styles from "./QrPositionControls.module.css";

type QrPositionControlsProps = {
  qrPlacement: QrPlacementDto;
  /** Until there's an image, there's no QR code to move, so it's hidden. */
  hasImage: boolean;
  onNudge: (direction: NudgeDirection) => void;
  onReset: () => void;
  /**
   * The preview the QR code is moved on, framed by the controls. It's told
   * the height it has to fill through `--preview-height`.
   */
  children: React.ReactNode;
};

/** Buttons around the preview that move the QR code 0.25% at a time, and put it
 * back where it started. */
export default function QrPositionControls({
  qrPlacement,
  hasImage,
  onNudge,
  onReset,
  children,
}: QrPositionControlsProps) {
  const controlsRef = useRef<HTMLDivElement>(null);
  const horizontalRef = useRef<HTMLDivElement>(null);
  const resetRef = useRef<HTMLDivElement>(null);

  // The controls take whatever height the dialog has left, so the preview
  // gets that height less the rows of buttons above and below it.
  useLayoutEffect(() => {
    const controls = controlsRef.current;
    const horizontal = horizontalRef.current;
    const reset = resetRef.current;
    if (!controls || !horizontal || !reset) return;

    const observer = new ResizeObserver(() => {
      const gap = parseFloat(getComputedStyle(controls).rowGap) || 0;
      const height =
        controls.clientHeight -
        horizontal.offsetHeight -
        reset.offsetHeight -
        2 * gap;
      controls.style.setProperty(
        "--preview-height",
        `${Math.max(0, height)}px`,
      );
    });
    observer.observe(controls);
    return () => observer.disconnect();
  }, []);

  function nudgeButton(direction: NudgeDirection) {
    return (
      <IconButton
        type="button"
        className={styles[direction]}
        label={`Move QR code ${direction}`}
        iconSrc={icons.rightArrow.src}
        disabled={!canNudgeQrCode(qrPlacement, direction)}
        onClick={() => onNudge(direction)}
      />
    );
  }

  return (
    <div ref={controlsRef} className={styles.controls} hidden={!hasImage}>
      <div ref={horizontalRef} className={styles.horizontal}>
        {nudgeButton("left")}
        {nudgeButton("right")}
      </div>
      <div className={styles.vertical}>
        {nudgeButton("up")}
        {nudgeButton("down")}
      </div>
      <div className={styles.preview}>{children}</div>
      <div ref={resetRef} className={styles.reset}>
        <Button
          variant="outline"
          fontSize="1rem"
          type="button"
          disabled={isDefaultQrPlacement(qrPlacement)}
          onClick={onReset}
        >
          Reset
        </Button>
      </div>
    </div>
  );
}
