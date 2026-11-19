import type { ScanMapDto } from "@application/dto/AnalyticsDto";

import styles from "./ScanMap.module.css";
import ScanMapCanvas from "./ScanMapCanvas";

interface ScanMapProps {
  scanMap: ScanMapDto;
}

/**
 * A heat map of where the campaign's located posters are, hotter where they've
 * been scanned more. Zoomed in, each poster also gets a circle, and at street
 * level a label with its scan count. Without any located posters, it says so
 * instead, and the map (and its tiles) never loads.
 */
export default function ScanMap({ scanMap }: ScanMapProps) {
  const { posters, maxScanCount, unmappedPosterCount, posterCount } = scanMap;
  return (
    <section className={styles.section} aria-labelledby="scan-map-heading">
      <h2 id="scan-map-heading" className={styles.heading}>
        Scan map
      </h2>
      {posters.length === 0 ? (
        <p>
          None of this campaign&apos;s posters are on the map yet. A poster
          appears here once it&apos;s registered with a location.
        </p>
      ) : (
        <>
          <ScanMapCanvas posters={posters} maxScanCount={maxScanCount} />
          {unmappedPosterCount > 0 && (
            <p className={styles.note}>
              {unmappedPosterCount === 1
                ? `1 of ${posterCount} posters isn't on the map because it hasn't been registered with a location.`
                : `${unmappedPosterCount} of ${posterCount} posters aren't on the map because they haven't been registered with a location.`}
            </p>
          )}
        </>
      )}
    </section>
  );
}
