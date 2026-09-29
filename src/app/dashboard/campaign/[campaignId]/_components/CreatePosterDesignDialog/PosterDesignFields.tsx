import React from "react";

import styles from "./PosterDesignFields.module.css";

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
  min: number;
  max: number;
  step: number;
  unit: string;
  disabled?: boolean;
  onChange: (name: keyof QrValues, value: string) => void;
};

function QrSliderField({
  name,
  label,
  value,
  min,
  max,
  step,
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
          min={min}
          max={max}
          step={step}
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
        onChange={onFileChange}
      />

      <QrSliderField
        name="qrXPosition"
        label="QR X position"
        value={qrValues.qrXPosition}
        min={0}
        max={100}
        step={0.1}
        unit="%"
        onChange={onQrChange}
      />
      <QrSliderField
        name="qrYPosition"
        label="QR Y position"
        value={qrValues.qrYPosition}
        min={0}
        max={100}
        step={0.1}
        unit="%"
        onChange={onQrChange}
      />
      <QrSliderField
        name="qrSize"
        label="QR size"
        value={qrValues.qrSize}
        min={0}
        max={maxQrSize}
        step={1}
        unit="px"
        disabled={maxQrSize === 0}
        onChange={onQrChange}
      />
      <QrSliderField
        name="qrRotation"
        label="QR rotation"
        value={qrValues.qrRotation}
        min={0}
        max={360}
        step={1}
        unit="°"
        onChange={onQrChange}
      />
    </div>
  );
}
