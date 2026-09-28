import React from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

// Escape hatch for local development so the dashboard can be worked on
// without going through Google sign-in. Gated on NODE_ENV as well so
// setting DISABLE_AUTH can never skip the check in a production build.
const authDisabled =
  process.env.NODE_ENV !== "production" && process.env.DISABLE_AUTH === "true";

type DashboardLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  if (authDisabled) {
    return <>{children}</>;
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }
  return <>{children}</>;
}
