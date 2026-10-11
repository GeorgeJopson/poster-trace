"use server";

import { APIError } from "better-auth/api";
import { redirect } from "next/navigation";

import { deleteCurrentUser } from "@/data/users";
import { routeNames } from "@/routeNames";

export async function deleteAccount(
  _previousError: string | null,
  formData: FormData,
) {
  if (formData.get("confirmation") !== "DELETE") {
    return 'Type "DELETE" to confirm.';
  }

  try {
    await deleteCurrentUser();
  } catch (error) {
    if (error instanceof APIError) {
      return error.message;
    }
    throw error;
  }

  redirect(routeNames.root);
}
