"use client";

import { useActionState } from "react";

import Dialog from "@/components/Dialog";
import { SubmitButton, TextInput } from "@/components/Form";

import { deleteAccount } from "./actions";
import styles from "./DeleteAccountDialog.module.css";

export default function DeleteAccountDialog() {
  const [error, formAction, isPending] = useActionState(deleteAccount, null);

  return (
    <Dialog
      title="Are you sure?"
      trigger={<button className={styles.deleteButton}>Delete Account</button>}
    >
      <form className={styles.form} action={formAction}>
        <p className={styles.text}>
          This permanently deletes your account, along with all of your
          campaigns, poster designs and their images.
        </p>
        <p className={styles.text}>
          <strong>Note:</strong> log out and back in again before deleting your
          account, to re-validate your connection.
        </p>

        <div className={styles.fields}>
          <TextInput
            label='Type "DELETE" to confirm'
            name="confirmation"
            autoComplete="off"
          />
        </div>

        {error ? <p role="alert">{error}</p> : null}

        <SubmitButton isPending={isPending} isPendingText="Deleting...">
          Delete Account
        </SubmitButton>
      </form>
    </Dialog>
  );
}
