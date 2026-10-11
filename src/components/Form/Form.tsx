import styles from "./Form.module.css";
import React, { SubmitEventHandler } from "react";

interface FormProps {
  fields?: React.ReactNode;
  submitBtn?: React.ReactNode;
  handleSubmit: SubmitEventHandler<HTMLFormElement>;
  error: string | null;
}

export default function Form({
  fields,
  submitBtn,
  handleSubmit,
  error,
}: FormProps) {
  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.fields}>{fields}</div>

      {error ? <p role="alert">{error}</p> : null}

      {submitBtn}
    </form>
  );
}
