import styles from "./TextInput.module.css";
import React, { useId } from "react";

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
}

export default function TextInput({
  label,
  type = "text",
  required = true,
  ...inputProps
}: TextInputProps) {
  const id = useId();
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
        {...inputProps}
      />
    </>
  );
}
