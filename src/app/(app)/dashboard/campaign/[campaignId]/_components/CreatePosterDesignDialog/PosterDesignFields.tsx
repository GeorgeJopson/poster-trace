import React from "react";

import type { QrPlacementDto } from "@application/dto/PosterDesignDto";
import { PosterDesignImageRules } from "@domain/campaign/design/PosterDesignImageRules";
import { QrPlacement } from "@domain/campaign/design/QrPlacement";

import styles from "./PosterDesignFields.module.css";

/** The QR placement values set with a slider. */
export type SliderField = "size" | "rotation";

type QrSliderFieldProps = {
  name: SliderField;
  label: string;
  value: number;
  unit: string;
  disabled?: boolean;
  onChange: (name: SliderField, value: number) => void;
};

function QrSliderField({
  name,
  label,
  value,
  unit,
  disabled,
  onChange,
}: QrSliderFieldProps) {
  return (
    <>
      <label className={styles.label} htmlFor={name}>
        {label}
      </label>
      <div className={styles.sliderWrapper}>
        <input
          className={styles.slider}
          id={name}
          type="range"
          min={QrPlacement.RANGES[name].min}
          max={QrPlacement.RANGES[name].max}
          step={QrPlacement.RANGES[name].step}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(name, parseFloat(event.target.value))}
        />
        <output className={styles.sliderValue} htmlFor={name}>
          {value.toFixed(1)}
          {unit}
        </output>
      </div>
    </>
  );
}

type PosterDesignFieldsProps = {
  qrPlacement: QrPlacementDto;
  /** The QR code's size can only be set once there's an image to see it on. */
  hasImage: boolean;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onQrChange: (name: SliderField, value: number) => void;
};

export default function PosterDesignFields({
  qrPlacement,
  hasImage,
  onFileChange,
  onQrChange,
}: PosterDesignFieldsProps) {
  return (
    <div className={styles.fields}>
      <label className={styles.label} htmlFor="posterImage">
        Poster design (one-page A4 PDF)
      </label>
      <input
        className={styles.input}
        id="posterImage"
        name="image"
        type="file"
        accept={PosterDesignImageRules.ALLOWED_TYPES.join(",")}
        required
        onChange={onFileChange}
      />

      <QrSliderField
        name="size"
        label="QR size"
        value={qrPlacement.size}
        unit="%"
        disabled={!hasImage}
        onChange={onQrChange}
      />
      <QrSliderField
        name="rotation"
        label="QR rotation"
        value={qrPlacement.rotation}
        unit="°"
        onChange={onQrChange}
      />
    </div>
  );
}
