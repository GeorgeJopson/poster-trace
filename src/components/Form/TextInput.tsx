import styles from "./TextInput.module.css";
import React, { useId } from "react";

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  // A hint shown under the input and read out with it by screen readers.
  helperText?: string;
}

export default function TextInput({
  label,
  helperText,
  type = "text",
  required = true,
  ...inputProps
}: TextInputProps) {
  const id = useId();
  const helperTextId = `${id}-helper`;
  return (
    <>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <input
        className={styles.input}
        id={id}
        type={type}
        required={required}
        aria-describedby={helperText ? helperTextId : undefined}
        {...inputProps}
      />
      {helperText ? (
        <p className={styles.helperText} id={helperTextId}>
          {helperText}
        </p>
      ) : null}
    </>
  );
}
