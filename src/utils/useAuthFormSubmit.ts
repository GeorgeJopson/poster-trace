import React, { useState } from "react";

type AuthFormResult = { error: { message?: string } | null };

// Submit handling shared by the auth forms. `submit` resolves with the auth
// request's result. On success the button stays pending unless
// `keepPendingOnSuccess` is false, because most forms navigate away next.
export default function useAuthFormSubmit(
  submit: (formData: FormData) => Promise<AuthFormResult>,
  {
    fallbackErrorMessage,
    keepPendingOnSuccess = true,
  }: { fallbackErrorMessage: string; keepPendingOnSuccess?: boolean },
) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setIsPending(true);
    setError(null);

    let result: AuthFormResult;
    try {
      result = await submit(formData);
    } catch {
      // e.g. the network request failed.
      result = { error: {} };
    }

    if (result.error) {
      setIsPending(false);
      setError(result.error.message || fallbackErrorMessage);
    } else if (!keepPendingOnSuccess) {
      setIsPending(false);
    }
  }

  return { isPending, error, handleSubmit };
}
