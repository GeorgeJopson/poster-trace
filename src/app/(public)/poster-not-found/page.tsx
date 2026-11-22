import type { Metadata } from "next";
import Link from "next/link";

import { routeNames } from "@/routeNames";
import { PublicNavBarSpacer } from "@/components/PublicNavigation";

export const metadata: Metadata = {
  title: "Poster not found",
  robots: { index: false },
};

// Shown, with a 404 status, when someone scans a QR code whose poster doesn't
// exist (see netlify/edge-functions/redirect.ts and ADR-0019).
export default function PosterNotFoundPage() {
  return (
    <div>
      <PublicNavBarSpacer />
      <h1>Poster not found</h1>
      <p>
        This poster&apos;s QR code doesn&apos;t lead anywhere. The poster may
        have been taken down, or its campaign deleted.
      </p>
      <Link href={routeNames.root}>Go to PosterTrace</Link>
    </div>
  );
}
