import { auth } from "@/lib/auth";

import { redirect } from "next/navigation";
import { headers } from "next/headers";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div>
      <p>{JSON.stringify(session)}</p>
    </div>
  );
}
