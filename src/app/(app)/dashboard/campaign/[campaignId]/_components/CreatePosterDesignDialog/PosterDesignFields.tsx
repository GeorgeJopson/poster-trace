import React from "react";

import { PosterDesignImageRules } from "@domain/campaign/design/PosterDesignImageRules";
import { QrPlacement } from "@domain/campaign/design/QrPlacement";

import styles from "./PosterDesignFields.module.css";

/** The QR inputs' values, named as in QrPlacement. */
export type QrValues = {
  x: string;
  y: string;
  size: string;
  rotation: string;
};

type QrSliderFieldProps = {
  name: keyof QrValues;
  label: string;
  value: string;
  unit: string;
  disabled?: boolean;
  onChange: (name: keyof QrValues, value: string) => void;
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
          name={name}
          type="range"
          min={QrPlacement.RANGES[name].min}
          max={QrPlacement.RANGES[name].max}
          step={QrPlacement.RANGES[name].step}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(name, event.target.value)}
        />
        <output className={styles.sliderValue} htmlFor={name}>
          {parseFloat(value).toFixed(1)}
          {unit}
        </output>
      </div>
    </>
  );
}

type PosterDesignFieldsProps = {
  qrValues: QrValues;
  /** The QR code's size can only be set once there's an image to see it on. */
  hasImage: boolean;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onQrChange: (name: keyof QrValues, value: string) => void;
};

export default function PosterDesignFields({
  qrValues,
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
        name="x"
        label="QR X position"
        value={qrValues.x}
        unit="%"
        onChange={onQrChange}
      />
      <QrSliderField
        name="y"
        label="QR Y position"
        value={qrValues.y}
        unit="%"
        onChange={onQrChange}
      />
      <QrSliderField
        name="size"
        label="QR size"
        value={qrValues.size}
        unit="%"
        disabled={!hasImage}
        onChange={onQrChange}
      />
      <QrSliderField
        name="rotation"
        label="QR rotation"
        value={qrValues.rotation}
        unit="°"
        onChange={onQrChange}
      />
    </div>
  );
}
