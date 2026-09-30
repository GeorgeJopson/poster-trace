import React from "react";

import styles from "./PosterDesignFields.module.css";
import { QR_RANGES } from "./posterDesignValidation";

export type QrValues = {
  qrXPosition: string;
  qrYPosition: string;
  qrSize: string;
  qrRotation: string;
};

type QrSliderFieldProps = {
  name: keyof QrValues;
  label: string;
  value: string;
  /** Overrides the max from QR_RANGES, e.g. for a limit based on the image. */
  max?: number;
  unit: string;
  disabled?: boolean;
  onChange: (name: keyof QrValues, value: string) => void;
};

function QrSliderField({
  name,
  label,
  value,
  max = QR_RANGES[name].max,
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
          min={QR_RANGES[name].min}
          max={max}
          step={QR_RANGES[name].step}
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
  /** Largest allowed QR size in pixels: min(image width, image height). */
  maxQrSize: number;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onQrChange: (name: keyof QrValues, value: string) => void;
};

export default function PosterDesignFields({
  qrValues,
  maxQrSize,
  onFileChange,
  onQrChange,
}: PosterDesignFieldsProps) {
  return (
    <div className={styles.fields}>
      <label className={styles.label} htmlFor="posterImage">
        Poster image
      </label>
      <input
        className={styles.input}
        id="posterImage"
        name="image"
        type="file"
        accept="image/*"
        required
        onChange={onFileChange}
      />

      <QrSliderField
        name="qrXPosition"
        label="QR X position"
        value={qrValues.qrXPosition}
        unit="%"
        onChange={onQrChange}
      />
      <QrSliderField
        name="qrYPosition"
        label="QR Y position"
        value={qrValues.qrYPosition}
        unit="%"
        onChange={onQrChange}
      />
      <QrSliderField
        name="qrSize"
        label="QR size"
        value={qrValues.qrSize}
        max={maxQrSize}
        unit="px"
        disabled={maxQrSize === 0}
        onChange={onQrChange}
      />
      <QrSliderField
        name="qrRotation"
        label="QR rotation"
        value={qrValues.qrRotation}
        unit="°"
        onChange={onQrChange}
      />
    </div>
  );
}
