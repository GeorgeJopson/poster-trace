import React from "react";

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

const DIRECTIONS: NudgeDirection[] = ["left", "up", "down", "right"];

type QrPositionControlsProps = {
  qrPlacement: QrPlacementDto;
  /** Until there's an image, there's no QR code to see move. */
  hasImage: boolean;
  onNudge: (direction: NudgeDirection) => void;
  onReset: () => void;
};

/** Buttons that move the QR code 1% at a time, and put it back where it started. */
export default function QrPositionControls({
  qrPlacement,
  hasImage,
  onNudge,
  onReset,
}: QrPositionControlsProps) {
  return (
    <div className={styles.controls}>
      <div className={styles.nudges}>
        {DIRECTIONS.map((direction) => (
          <IconButton
            key={direction}
            type="button"
            className={styles[direction]}
            label={`Move QR code ${direction}`}
            iconSrc={icons.rightArrow.src}
            disabled={!hasImage || !canNudgeQrCode(qrPlacement, direction)}
            onClick={() => onNudge(direction)}
          />
        ))}
      </div>
      <Button
        variant="outline"
        fontSize="1rem"
        type="button"
        disabled={!hasImage || isDefaultQrPlacement(qrPlacement)}
        onClick={onReset}
      >
        Reset
      </Button>
    </div>
  );
}
