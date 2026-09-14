import { auth } from "@/lib/auth";

import { headers } from "next/headers";
import CentralColumn from "@/components/CentralColumn";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <div>
        <CentralColumn>
            <p>{JSON.stringify(session)}</p>
        </CentralColumn>
    </div>
  );
}
