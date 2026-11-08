import type { ScanDistributionRowDto } from "@application/dto/AnalyticsDto";
import GroupedBarChart, {
  type BarSeries,
  MAX_SERIES,
} from "@/components/GroupedBarChart";

import { designLabel } from "../../designLabel";
import styles from "../../Analytics.module.css";

const SCANS_KEY = "scans";
const OTHER_KEY = "other";

interface ScanDistributionProps {
  distribution: ScanDistributionRowDto[];
  /** The campaign's design ids, in campaign order. */
  designIds: string[];
}

/** How many of each design's posters have each scan count. */
export default function ScanDistribution({
  distribution,
  designIds,
}: ScanDistributionProps) {
  // Past the colours the chart can tell apart, the last designs are
  // combined into one series rather than reusing a colour.
  const shown =
    designIds.length > MAX_SERIES
      ? designIds.slice(0, MAX_SERIES - 1)
      : designIds;
  const others = designIds.slice(shown.length);

  const series: BarSeries[] = shown.map((id) => ({
    key: id,
    label: designLabel(designIds, id),
  }));
  if (others.length > 0) {
    series.push({ key: OTHER_KEY, label: "Other poster designs" });
  }
  const data = distribution.map(({ scans, posters }) => {
    const row: Record<string, number> = { [SCANS_KEY]: scans };
    for (const id of shown) row[id] = posters[id];
    if (others.length > 0) {
      row[OTHER_KEY] = others.reduce((sum, id) => sum + posters[id], 0);
    }
    return row;
  });

  return (
    <section
      className={styles.section}
      aria-labelledby="scan-distribution-heading"
    >
      <h2 id="scan-distribution-heading" className={styles.heading}>
        Scan distribution
      </h2>
      <GroupedBarChart
        title="Number of posters with each number of scans, by poster design"
        data={data}
        xKey={SCANS_KEY}
        series={series}
        xLabel="Scans"
        yLabel="Posters"
      />
    </section>
  );
}
