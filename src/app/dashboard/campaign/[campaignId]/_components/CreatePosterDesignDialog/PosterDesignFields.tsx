import React from "react";

import styles from "./PosterDesignFields.module.css";

export type QrValues = {
  qrXPosition: string;
  qrYPosition: string;
  qrSize: string;
  qrRotation: string;
};

type QrNumberFieldProps = {
  name: keyof QrValues;
  label: string;
  value: string;
  onChange: (name: keyof QrValues, value: string) => void;
};

function QrNumberField({ name, label, value, onChange }: QrNumberFieldProps) {
  return (
    <>
      <label className={styles.label} htmlFor={name}>
        {label}
      </label>
      <input
        className={styles.input}
        id={name}
        name={name}
        type="number"
        step="any"
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
      />
    </>
  );
}

type PosterDesignFieldsProps = {
  qrValues: QrValues;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onQrChange: (name: keyof QrValues, value: string) => void;
};

export default function PosterDesignFields({
  qrValues,
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

      <QrNumberField
        name="qrXPosition"
        label="QR X position"
        value={qrValues.qrXPosition}
        onChange={onQrChange}
      />
      <QrNumberField
        name="qrYPosition"
        label="QR Y position"
        value={qrValues.qrYPosition}
        onChange={onQrChange}
      />
      <QrNumberField
        name="qrSize"
        label="QR size"
        value={qrValues.qrSize}
        onChange={onQrChange}
      />
      <QrNumberField
        name="qrRotation"
        label="QR rotation"
        value={qrValues.qrRotation}
        onChange={onQrChange}
      />
    </div>
  );
}
