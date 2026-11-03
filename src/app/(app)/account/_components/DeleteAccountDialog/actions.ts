"use server";

import { redirect } from "next/navigation";

import { AccountDeletionRefusedError } from "@application/errors/AccountDeletionRefusedError";
import { getAccountService } from "@di/container";
import { routeNames } from "@/routeNames";
import { withSignInRedirect } from "@/utils/withSignInRedirect";

export async function deleteAccount(
  _previousError: string | null,
  formData: FormData,
) {
  return withSignInRedirect(async () => {
    if (formData.get("confirmation") !== "DELETE") {
      return 'Type "DELETE" to confirm.';
    }

    try {
      await getAccountService().deleteAccount();
    } catch (error) {
      if (error instanceof AccountDeletionRefusedError) {
        return error.message;
      }
      throw error;
    }

    redirect(routeNames.root);
  });
}
