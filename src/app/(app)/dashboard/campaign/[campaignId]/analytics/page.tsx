import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getCampaignAnalyticsService } from "@di/container";
import CentralColumn from "@/components/CentralColumn";
import { withSignInRedirect } from "@/utils/withSignInRedirect";

import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Analytics",
};

/** Enough of a poster's id to tell its posters apart at a glance. */
function shortPosterId(id: string) {
  return id.slice(0, 8);
}

function scansText(count: number) {
  return count === 1 ? "1 scan" : `${count} scans`;
}

// A text-only placeholder: each poster's scan count, grouped by design.
export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const counts = await withSignInRedirect(() =>
    getCampaignAnalyticsService().getMyCampaignScanCounts(campaignId),
  );
  if (!counts) {
    notFound();
  }

  return (
    <CentralColumn>
      <div className={styles.wrapper}>
        <h2 className={styles.heading}>
          Scans: {scansText(counts.scanCount)} in total
        </h2>
        {counts.posterDesigns.length === 0 ? (
          <p>No poster designs yet.</p>
        ) : (
          counts.posterDesigns.map((design, index) => (
            <section
              key={design.id}
              aria-labelledby={`design-${design.id}`}
              className={styles.design}
            >
              <h3 id={`design-${design.id}`} className={styles.designHeading}>
                Poster design {index + 1}: {scansText(design.scanCount)}
              </h3>
              {design.posters.length === 0 ? (
                <p>No posters generated yet.</p>
              ) : (
                <ul className={styles.posters}>
                  {design.posters.map((poster) => (
                    <li key={poster.id}>
                      Poster {shortPosterId(poster.id)}:{" "}
                      {scansText(poster.scanCount)}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))
        )}
      </div>
    </CentralColumn>
  );
}
