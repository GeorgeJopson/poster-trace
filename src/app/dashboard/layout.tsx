import React from "react";
import { requireUserId } from "@/lib/session";

type DashboardLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  await requireUserId();
  return <>{children}</>;
}
